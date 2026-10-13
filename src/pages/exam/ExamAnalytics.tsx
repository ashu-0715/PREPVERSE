import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Target, Brain, AlertTriangle, Clock } from "lucide-react";

export default function ExamAnalytics() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("gate_subjects").select("slug,name,weight").order("sort_order").then(({ data }) => setSubjects(data || []));
    supabase.from("gate_quiz_attempts").select("*").order("created_at").then(({ data }) => setAttempts(data || []));
    supabase.from("gate_flashcards").select("subject_slug,reviews,correct").then(({ data }) => setCards(data || []));
  }, []);

  const bySubject = useMemo(() => subjects.map((s) => {
    const a = attempts.filter((x) => x.subject_slug === s.slug);
    const score = a.reduce((n, x) => n + x.score, 0), total = a.reduce((n, x) => n + x.total, 0);
    const c = cards.filter((x) => x.subject_slug === s.slug);
    const rev = c.reduce((n, x) => n + x.reviews, 0), ok = c.reduce((n, x) => n + x.correct, 0);
    return { ...s, tests: a.length, accuracy: total ? Math.round((score / total) * 100) : null, recall: rev ? Math.round((ok / rev) * 100) : null };
  }), [subjects, attempts, cards]);

  const totalQ = attempts.reduce((n, x) => n + x.total, 0);
  const overall = totalQ ? Math.round((attempts.reduce((n, x) => n + x.score, 0) / totalQ) * 100) : null;
  const minutes = Math.round(attempts.reduce((n, x) => n + x.time_taken_s, 0) / 60);
  const reviews = cards.reduce((n, x) => n + x.reviews, 0);
  const weak = bySubject.filter((s) => s.accuracy !== null && s.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);
  const recent = attempts.slice(-10);

  const stats = [
    { label: "Tests taken", value: attempts.length, icon: Target },
    { label: "Overall accuracy", value: overall === null ? "—" : `${overall}%`, icon: BarChart3 },
    { label: "Flashcard reviews", value: reviews, icon: Brain },
    { label: "Minutes in tests", value: minutes, icon: Clock },
  ];

  if (!attempts.length && !reviews) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Card className="p-8 text-center">
          <p className="font-semibold">Nothing to analyse yet 📊</p>
          <p className="text-sm text-muted-foreground mt-1">Take a mock test or review some flashcards and your trends will show up here.</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button onClick={() => navigate("/exam/mocks")}>Take a test</Button>
            <Button variant="outline" onClick={() => navigate("/exam/revision")}>Revise flashcards</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground">You're getting there 🚀 Consistency matters more than speed.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {recent.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Last {recent.length} test scores</h3>
          <div className="flex items-end gap-2 h-40">
            {recent.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              return (
                <div key={a.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  <div className="w-full rounded-t-lg bg-primary animate-grow" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <span className="text-[10px] text-muted-foreground truncate max-w-full">{a.subject_slug}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {weak.length > 0 && (
        <Card className="p-5 border-destructive/30">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-destructive" /><h3 className="font-semibold">Needs more practice</h3></div>
          <p className="text-sm text-muted-foreground">{weak.map((s) => `${s.name} (${s.accuracy}%)`).join(", ")} — try a few flashcards on these this week.</p>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Subject breakdown</h3>
        <div className="space-y-3">
          {bySubject.map((s) => (
            <div key={s.slug}>
              <div className="flex justify-between text-xs mb-1">
                <span>{s.name} <span className="text-muted-foreground">· {s.weight}% of GATE</span></span>
                <span className="text-muted-foreground">
                  {s.accuracy === null ? "no tests" : `${s.accuracy}% test`}{s.recall !== null ? ` · ${s.recall}% recall` : ""}
                </span>
              </div>
              <Progress value={s.accuracy ?? 0} className="h-1.5" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
