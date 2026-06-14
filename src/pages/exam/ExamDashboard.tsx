import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Trophy, Target, Clock, TrendingUp, Sparkles, BookOpen, ChevronRight,
  AlertTriangle, CalendarDays,
} from "lucide-react";

const GATE_DATE = new Date("2027-02-06T09:00:00");

export default function ExamDashboard() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    supabase.from("gate_subjects").select("*").order("sort_order").then(({ data }) => {
      setSubjects(data || []);
    });
    const diff = Math.max(0, Math.ceil((GATE_DATE.getTime() - Date.now()) / 86400000));
    setDaysLeft(diff);
  }, []);

  const stats = [
    { label: "Days to GATE", value: daysLeft, icon: CalendarDays, color: "from-red-500 to-rose-500" },
    { label: "Streak", value: "0 days", icon: Flame, color: "from-orange-500 to-amber-500" },
    { label: "XP", value: "0", icon: Trophy, color: "from-yellow-500 to-amber-500" },
    { label: "Rank Pred.", value: "—", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 mb-2">
              <Sparkles className="w-3 h-3 mr-1" /> AI-Powered
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold">Crack GATE CSE with confidence</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Personalized plans, PYQ explainers, mock analyses, and 24/7 AI mentor.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate("/exam/mentor")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
          >
            Ask AI Mentor <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 bg-card/50 backdrop-blur border-border/50">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly goals */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold">Weekly Goals</h3>
            </div>
            <Badge variant="secondary" className="text-xs">0 / 5 done</Badge>
          </div>
          <div className="space-y-3">
            {[
              { label: "Complete 3 OS topics", pct: 0 },
              { label: "Solve 30 PYQs", pct: 0 },
              { label: "1 full-length mock test", pct: 0 },
              { label: "Revise 50 flashcards", pct: 0 },
              { label: "Read 1 algorithms paper", pct: 0 },
            ].map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{g.label}</span>
                  <span>{g.pct}%</span>
                </div>
                <Progress value={g.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>

        {/* AI Recommendation */}
        <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold">AI Recommends</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Start with <span className="text-foreground font-medium">Operating Systems → Process Synchronization</span>. High weight, frequently asked.
          </p>
          <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/exam/subjects")}>
            Open Subject
          </Button>
        </Card>
      </div>

      {/* Subject mastery */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold">Subject Mastery</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate("/exam/subjects")}>
            View all <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.slice(0, 6).map((s) => (
            <div key={s.id} className="p-3 rounded-lg border border-border/50 hover:border-indigo-500/40 transition-colors cursor-pointer"
              onClick={() => navigate("/exam/subjects")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate">{s.name}</span>
                <Badge variant="outline" className="text-[10px]">{s.weight}%</Badge>
              </div>
              <Progress value={0} className="h-1" />
            </div>
          ))}
        </div>
      </Card>

      {/* Weak topics alert */}
      <Card className="p-5 border-orange-500/30 bg-orange-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">No weak topics detected yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Start practicing to let AI identify topics that need more revision.
            </p>
          </div>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}