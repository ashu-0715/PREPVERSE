import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { callExamAi, nextInterval } from "@/lib/examAi";
import { toast } from "sonner";
import { Brain, Loader2, RotateCcw, Check, X, Sparkles, Trash2 } from "lucide-react";

type Card_ = { id: string; subject_slug: string; topic: string | null; front: string; back: string; interval_days: number; reviews: number; correct: number; due_at: string };

export default function ExamRevision() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [cards, setCards] = useState<Card_[]>([]);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("gate_flashcards").select("*").order("due_at");
    setCards((data as Card_[]) || []);
  };

  useEffect(() => {
    supabase.from("gate_subjects").select("slug,name").order("sort_order").then(({ data }) => {
      setSubjects(data || []);
      if (data?.[0]) setSubject(data[0].slug);
    });
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    load();
  }, []);

  const due = useMemo(() => cards.filter((c) => new Date(c.due_at) <= new Date()), [cards]);
  const current = due[0];
  const nameOf = (slug: string) => subjects.find((s) => s.slug === slug)?.name ?? slug;

  const generate = async () => {
    if (!userId || !subject) return;
    setBusy(true);
    try {
      const res = await callExamAi<{ cards: { topic: string; front: string; back: string }[] }>({
        action: "flashcards", subject: nameOf(subject), topic, count: 10,
      });
      const rows = res.cards.map((c) => ({ ...c, user_id: userId, subject_slug: subject }));
      const { error } = await supabase.from("gate_flashcards").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} new flashcards ready ✨`);
      setTopic("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const grade = async (knewIt: boolean) => {
    if (!current) return;
    const interval = nextInterval(current.interval_days, knewIt);
    const due_at = new Date(Date.now() + (interval === 0 ? 10 * 60000 : interval * 86400000)).toISOString();
    const patch = { interval_days: interval, reviews: current.reviews + 1, correct: current.correct + (knewIt ? 1 : 0), due_at };
    setCards((cs) => cs.map((c) => (c.id === current.id ? { ...c, ...patch } : c)));
    setFlipped(false);
    await supabase.from("gate_flashcards").update(patch).eq("id", current.id);
  };

  const remove = async (id: string) => {
    setCards((cs) => cs.filter((c) => c.id !== id));
    await supabase.from("gate_flashcards").delete().eq("id", id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Smart Revision</h2>
        <p className="text-sm text-muted-foreground">AI flashcards with spaced repetition — cards you know come back later, tricky ones sooner.</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-primary" /><h3 className="font-semibold">Make new flashcards</h3></div>
        <div className="grid sm:grid-cols-[200px_1fr_auto] gap-2">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Topic (optional), e.g. Deadlocks" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={200} />
          <Button onClick={generate} disabled={busy || !subject}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}Generate 10
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-2 min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /><h3 className="font-semibold">Review now</h3></div>
            <Badge variant="secondary">{due.length} due</Badge>
          </div>
          {current ? (
            <>
              <button onClick={() => setFlipped((f) => !f)} className="flex-1 rounded-2xl border bg-muted/40 p-6 text-left hover:bg-muted/60 transition-colors">
                <div className="text-xs text-muted-foreground mb-2">{nameOf(current.subject_slug)}{current.topic ? ` · ${current.topic}` : ""} · {flipped ? "Answer" : "Question — tap to flip"}</div>
                <p className={flipped ? "text-base" : "text-lg font-semibold"}>{flipped ? current.back : current.front}</p>
              </button>
              <div className="flex gap-2 mt-4">
                {!flipped ? (
                  <Button className="flex-1" variant="outline" onClick={() => setFlipped(true)}><RotateCcw className="w-4 h-4 mr-1" />Show answer</Button>
                ) : (
                  <>
                    <Button className="flex-1" variant="outline" onClick={() => grade(false)}><X className="w-4 h-4 mr-1" />Still learning</Button>
                    <Button className="flex-1" onClick={() => grade(true)}><Check className="w-4 h-4 mr-1" />Got it</Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center text-muted-foreground text-sm">
              {cards.length ? "All caught up 🎉 Come back later for the next round." : "No flashcards yet 🌱 Generate some above to start revising."}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Your deck ({cards.length})</h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {cards.map((c) => (
              <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg border text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{c.front}</p>
                  <p className="text-[11px] text-muted-foreground">{nameOf(c.subject_slug)} · next in {c.interval_days}d</p>
                </div>
                <button onClick={() => remove(c.id)} aria-label="Delete card" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {!cards.length && <p className="text-xs text-muted-foreground">Nothing here yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
