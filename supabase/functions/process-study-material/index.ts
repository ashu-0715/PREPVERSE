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

    // Generate questions using AI - Smart Teacher Mode
    const systemPrompt = `You are a SMART TEACHER who deeply analyzes study material before generating questions. You don't just extract text — you UNDERSTAND the content.

## STEP 1: ANALYZE THE CONTENT
Before generating questions, internally:
- Identify main topics and subtopics
- Extract key concepts, definitions, and principles
- Identify important keywords and technical terms
- Detect relationships (comparison, cause-effect, usage)
- Identify examples and applications
- Detect repeated or emphasized concepts

## STEP 2: GENERATE EXACTLY ${questionCount} QUESTIONS
Generate a balanced mix across these categories:

### 1. Conceptual Questions (40%) — MOST IMPORTANT
- Focus on understanding "why" and "how"
- Example: "Why is scheduling important in operating systems?"

### 2. Application-Based Questions (25%)
- Real-world scenarios requiring applied knowledge
- Example: "If multiple processes need CPU time simultaneously, which algorithm minimizes average waiting time?"

### 3. Definition-Based Questions (15%)
- Short, direct recall questions
- question_type: "mcq" or "true_false"

### 4. Comparison Questions (10%)
- Differences and similarities between concepts
- Example: "Which statement correctly differentiates a thread from a process?"

### 5. Trick/Confusion-Based Questions (10%)
- Target common student mistakes
- Example: "Which of the following is NOT a scheduling algorithm?"

## STEP 3: OUTPUT FORMAT
Return a JSON array where each object has:
- question_type: "mcq" | "true_false" | "fill_blank"
- question_text: clear, concise question
- options: array of strings (4 for MCQ, ["True","False"] for true_false, [] for fill_blank)
- correct_answer: the correct answer string
- explanation: brief explanation of WHY the answer is correct
- difficulty: "${difficulty}"
- topic: specific topic/subtopic from the material
- category: "conceptual" | "application" | "definition" | "comparison" | "tricky"

## QUALITY RULES
- Questions must be clear and concise — short enough to read during gameplay
- Options should be short (1-5 words ideally), meaningful, and not obviously wrong
- Ensure only ONE correct answer per question
- Avoid vague or ambiguous wording
- Avoid repeating the same question structure
- Prioritize conceptual understanding over memorization
- Keep language simple and student-friendly

## DIFFICULTY CONTROL
- easy: direct definitions and basic recall
- medium: understanding-based, requires connecting concepts
- hard: application, analysis, and tricky logic

## GAME OPTIMIZATION
- Questions should be readable in under 5 seconds
- Options should enable fast decision-making
- Avoid very long paragraphs in question text

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
          { role: "user", content: `Deeply analyze this study material. First identify all key concepts, topics, definitions, relationships, and important principles. Then generate ${questionCount} high-quality quiz questions based on your analysis. Prioritize conceptual understanding over rote memorization.\n\nSTUDY MATERIAL:\n\n${content.substring(0, 15000)}` },
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
      // Strip markdown code fences if present
      let cleaned = aiContent.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in: " + cleaned.substring(0, 200));
      // Remove control characters that break JSON.parse
      const sanitized = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
        if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
        return '';
      });
      questions = JSON.parse(sanitized);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Parsed result is not a valid question array");
      }
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Raw AI content:", aiContent.substring(0, 500));
      throw new Error("Failed to parse AI-generated questions. Please try again.");
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

    // Update user game stats - manual upsert
    try {
      const { data: existingStats } = await supabase
        .from("user_game_stats")
        .select("id, materials_uploaded")
        .eq("user_id", user.id)
        .single();

      if (existingStats) {
        await supabase
          .from("user_game_stats")
          .update({ materials_uploaded: (existingStats.materials_uploaded || 0) + 1 })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_game_stats")
          .insert({ user_id: user.id, materials_uploaded: 1 });
      }
    } catch (_e) {
      // Non-critical, ignore
    }

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
