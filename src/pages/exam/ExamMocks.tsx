import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { callExamAi } from "@/lib/examAi";
import { toast } from "sonner";
import { ClipboardCheck, Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Q = { question: string; options: string[]; answer_index: number; explanation: string };

export default function ExamMocks() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [qs, setQs] = useState<Q[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(0);

  useEffect(() => {
    supabase.from("gate_subjects").select("slug,name").order("sort_order").then(({ data }) => {
      setSubjects(data || []);
      if (data?.[0]) setSubject(data[0].slug);
    });
  }, []);
  const nameOf = (slug: string) => subjects.find((s) => s.slug === slug)?.name ?? slug;

  const start = async () => {
    setBusy(true);
    try {
      const res = await callExamAi<{ questions: Q[] }>({ action: "quiz", subject: nameOf(subject), topic, count: 10 });
      setQs(res.questions); setAnswers({}); setSubmitted(false); started.current = Date.now();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!qs) return;
    const score = qs.filter((q, i) => answers[i] === q.answer_index).length;
    setSubmitted(true);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("gate_quiz_attempts").insert({
        user_id: u.user.id, subject_slug: subject, score, total: qs.length,
        time_taken_s: Math.round((Date.now() - started.current) / 1000),
      });
    }
    toast.success(`You scored ${score}/${qs.length}`);
  };

  const score = qs ? qs.filter((q, i) => answers[i] === q.answer_index).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mock Tests</h2>
        <p className="text-sm text-muted-foreground">10-question GATE-style tests, made fresh by AI. Results feed your Analytics.</p>
      </div>
      <Card className="p-5">
        <div className="grid sm:grid-cols-[200px_1fr_auto] gap-2">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Topic (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
          <Button onClick={start} disabled={busy || !subject}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}Start test
          </Button>
        </div>
      </Card>

      {qs ? (
        <div className="space-y-4">
          {submitted && (
            <Card className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-primary" /><span className="font-semibold">Score: {score}/{qs.length}</span></div>
              <Badge variant="secondary">{Math.round((score / qs.length) * 100)}%</Badge>
            </Card>
          )}
          {qs.map((q, i) => (
            <Card key={i} className="p-5">
              <p className="font-medium mb-3"><span className="text-muted-foreground mr-1">Q{i + 1}.</span>{q.question}</p>
              <div className="grid gap-2">
                {q.options.map((o, j) => {
                  const picked = answers[i] === j;
                  const correct = submitted && j === q.answer_index;
                  const wrong = submitted && picked && j !== q.answer_index;
                  return (
                    <button key={j} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                      className={cn("text-left text-sm px-3 py-2 rounded-xl border transition-colors flex items-center gap-2",
                        picked && !submitted && "border-primary bg-primary/10",
                        correct && "border-secondary bg-secondary/10",
                        wrong && "border-destructive bg-destructive/10",
                        !submitted && !picked && "hover:bg-muted")}>
                      {correct && <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />}
                      {wrong && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                      {o}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="text-xs text-muted-foreground mt-3"><span className="font-semibold text-foreground">Why: </span>{q.explanation}</p>}
            </Card>
          ))}
          {!submitted && (
            <Button className="w-full" onClick={submit} disabled={Object.keys(answers).length === 0}>
              Submit ({Object.keys(answers).length}/{qs.length} answered)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Pick a subject and start a test whenever you're ready ✍️</p>
      )}
    </div>
  );
}
