import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { content, fileName, difficulty = "medium", questionCount = 15 } = await req.json();

    if (!content || content.trim().length < 50) {
      throw new Error("Content is too short to generate meaningful questions");
    }

    // Create question set
    const { data: questionSet, error: setError } = await supabase
      .from("game_question_sets")
      .insert({
        user_id: user.id,
        title: fileName || "Study Material",
        source_file_name: fileName,
        difficulty,
        total_questions: questionCount,
      })
      .select()
      .single();

    if (setError) throw new Error(`Failed to create question set: ${setError.message}`);

    // Generate questions using AI
    const systemPrompt = `You are an educational quiz generator. Given study material, generate exactly ${questionCount} quiz questions.

Generate a mix of question types:
- MCQ (multiple choice with 4 options)
- true_false (True/False questions)
- fill_blank (Fill in the blank)

For each question, return a JSON array with objects having these fields:
- question_type: "mcq" | "true_false" | "fill_blank"
- question_text: the question string
- options: array of option strings (4 for MCQ, ["True", "False"] for true_false, [] for fill_blank)
- correct_answer: the correct answer string
- explanation: brief explanation of the answer
- difficulty: "${difficulty}"
- topic: topic/subject area

Difficulty level: ${difficulty}
- easy: basic recall and definitions
- medium: understanding and application
- hard: analysis and critical thinking

Return ONLY a valid JSON array, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate quiz questions from this study material:\n\n${content.substring(0, 15000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let questions;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found");
      questions = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse AI-generated questions");
    }

    // Insert questions
    const questionsToInsert = questions.map((q: any) => ({
      question_set_id: questionSet.id,
      question_type: q.question_type || "mcq",
      question_text: q.question_text,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation || "",
      difficulty: q.difficulty || difficulty,
      topic: q.topic || "",
    }));

    const { error: insertError } = await supabase
      .from("game_questions")
      .insert(questionsToInsert);

    if (insertError) throw new Error(`Failed to insert questions: ${insertError.message}`);

    // Update question set count and topics
    const topics = [...new Set(questions.map((q: any) => q.topic).filter(Boolean))];
    await supabase
      .from("game_question_sets")
      .update({ total_questions: questions.length, topics })
      .eq("id", questionSet.id);

    // Update user game stats
    await supabase.rpc("upsert_game_stats_upload", { p_user_id: user.id }).catch(() => {
      // If RPC doesn't exist, do manual upsert
      return supabase
        .from("user_game_stats")
        .upsert(
          { user_id: user.id, materials_uploaded: 1 },
          { onConflict: "user_id" }
        );
    });

    return new Response(JSON.stringify({
      questionSet: questionSet,
      questionsGenerated: questions.length,
      topics,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-study-material error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
