import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { callExamAi } from "@/lib/examAi";
import { toast } from "sonner";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";

type Plan = { summary: string; weeks: { week: number; focus: string; tasks: { title: string; subject: string; hours: number }[] }[] };

export default function ExamPlanner() {
  const [row, setRow] = useState<{ id: string; plan: Plan; completed: string[] } | null>(null);
  const [hours, setHours] = useState("3");
  const [weeks, setWeeks] = useState("8");
  const [weak, setWeak] = useState("");
  const [strong, setStrong] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("gate_study_plans").select("*").order("created_at", { ascending: false }).limit(1).then(({ data }) => {
      if (data?.[0]) setRow({ id: data[0].id, plan: data[0].plan as Plan, completed: (data[0].completed as string[]) || [] });
    });
  }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      const plan = await callExamAi<Plan>({ action: "plan", hours: Number(hours), weeks: Number(weeks), weak, strong });
      const { data, error } = await supabase.from("gate_study_plans")
        .insert({ user_id: u.user.id, hours_per_day: Number(hours), plan }).select().single();
      if (error) throw error;
      setRow({ id: data.id, plan, completed: [] });
      toast.success("Your study plan is ready 🚀");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (key: string) => {
    if (!row) return;
    const completed = row.completed.includes(key) ? row.completed.filter((k) => k !== key) : [...row.completed, key];
    setRow({ ...row, completed });
    await supabase.from("gate_study_plans").update({ completed }).eq("id", row.id);
  };

  const total = row?.plan.weeks.reduce((n, w) => n + w.tasks.length, 0) ?? 0;
  const done = row?.completed.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Study Planner</h2>
        <p className="text-sm text-muted-foreground">Tell us how you study — AI builds a week-by-week GATE plan around it.</p>
      </div>

      <Card className="p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label className="text-xs">Hours per day</Label><Input type="number" min={1} max={14} value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          <div><Label className="text-xs">Weeks</Label><Input type="number" min={2} max={16} value={weeks} onChange={(e) => setWeeks(e.target.value)} /></div>
          <div><Label className="text-xs">Weak subjects</Label><Input placeholder="e.g. TOC, Compilers" value={weak} onChange={(e) => setWeak(e.target.value)} maxLength={300} /></div>
          <div><Label className="text-xs">Strong subjects</Label><Input placeholder="e.g. DBMS" value={strong} onChange={(e) => setStrong(e.target.value)} maxLength={300} /></div>
        </div>
        <Button className="mt-4" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {row ? "Make a new plan" : "Create my plan"}
        </Button>
        {busy && <p className="text-xs text-muted-foreground mt-2">This takes about 20–40 seconds…</p>}
      </Card>

      {row ? (
        <>
          <Card className="p-5">
            <p className="text-sm">{row.plan.summary}</p>
            <div className="flex justify-between text-xs mt-3 mb-1"><span className="text-muted-foreground">Plan progress</span><span>{done}/{total} tasks</span></div>
            <Progress value={total ? (done / total) * 100 : 0} className="h-2" />
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {row.plan.weeks.map((w) => (
              <Card key={w.week} className="p-5">
                <div className="flex items-center gap-2 mb-1"><CalendarDays className="w-4 h-4 text-primary" /><h3 className="font-semibold">Week {w.week}</h3></div>
                <p className="text-xs text-muted-foreground mb-3">{w.focus}</p>
                <div className="space-y-2">
                  {w.tasks.map((t, i) => {
                    const key = `${w.week}-${i}`;
                    const checked = row.completed.includes(key);
                    return (
                      <label key={key} className="flex items-start gap-2 text-sm cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={() => toggle(key)} className="mt-0.5" />
                        <span className={checked ? "line-through text-muted-foreground" : ""}>
                          {t.title} <span className="text-[11px] text-muted-foreground">· {t.subject} · {t.hours}h</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No plan yet 📅 Fill in the details above and we'll build one for you.</p>
      )}
    </div>
  );
}
