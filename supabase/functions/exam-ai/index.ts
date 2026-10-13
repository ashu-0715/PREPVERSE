// Structured AI generation for GATE Exam Support: flashcards, study plans, quizzes
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const str = { type: "string" };
const schemas: Record<string, any> = {
  flashcards: {
    type: "object", additionalProperties: false, required: ["cards"],
    properties: { cards: { type: "array", items: { type: "object", additionalProperties: false, required: ["topic", "front", "back"], properties: { topic: str, front: str, back: str } } } },
  },
  plan: {
    type: "object", additionalProperties: false, required: ["summary", "weeks"],
    properties: {
      summary: str,
      weeks: { type: "array", items: { type: "object", additionalProperties: false, required: ["week", "focus", "tasks"], properties: {
        week: { type: "integer" }, focus: str,
        tasks: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "subject", "hours"], properties: { title: str, subject: str, hours: { type: "number" } } } },
      } } },
    },
  },
  quiz: {
    type: "object", additionalProperties: false, required: ["questions"],
    properties: { questions: { type: "array", items: { type: "object", additionalProperties: false, required: ["question", "options", "answer_index", "explanation"], properties: {
      question: str, options: { type: "array", items: str }, answer_index: { type: "integer" }, explanation: str,
    } } } },
  },
};

function prompt(action: string, b: any): string {
  const subject = String(b.subject ?? "").slice(0, 100);
  const topic = String(b.topic ?? "").slice(0, 200);
  if (action === "flashcards")
    return `Create ${Math.min(Number(b.count) || 10, 20)} concise GATE CSE revision flashcards for subject "${subject}"${topic ? `, topic "${topic}"` : ""}. Front: a crisp question, formula prompt or concept. Back: a short precise answer (max 3 sentences, include formulas where useful).`;
  if (action === "plan")
    return `Build a ${Math.min(Number(b.weeks) || 8, 16)}-week GATE CSE study plan. Student studies ${Number(b.hours) || 3} hours/day. Weak subjects: ${String(b.weak ?? "none given").slice(0, 300)}. Strong subjects: ${String(b.strong ?? "none given").slice(0, 300)}. Prioritise by GATE weightage, include PYQ practice, mocks in later weeks and revision. Each week 4-7 tasks with subject names and hours. Summary: 2 encouraging sentences.`;
  return `Create ${Math.min(Number(b.count) || 10, 15)} GATE CSE multiple-choice questions (4 options each, exactly one correct) for subject "${subject}"${topic ? `, topic "${topic}"` : ""}, GATE-level difficulty, mixed conceptual and numerical. answer_index is 0-based. Explanation: short worked reasoning.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (!schemas[action]) return json({ error: "Unknown action" }, 400);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: "You are Pathora's GATE CSE expert tutor. Be accurate and exam-focused.",
        input: [{ role: "user", content: prompt(action, body) }],
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: action, strict: true, schema: schemas[action] } },
        stream: true,
        store: false,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      let msg = t;
      try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? t; } catch { /* keep */ }
      if (upstream.status === 429) msg = "Too many requests right now. Try again in a minute.";
      if (upstream.status === 402) msg = msg || "AI credits are used up for this workspace.";
      return json({ error: msg }, upstream.status);
    }

    const reader = upstream.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error") return json({ error: ev.response?.error?.message ?? ev.message ?? "AI failed" }, 502);
        } catch { /* partial */ }
      }
    }
    if (!out) return json({ error: "The AI didn't return anything. Try again." }, 502);
    return json(JSON.parse(out));
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
