import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen } from "lucide-react";

export default function ExamSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("gate_subjects").select("*").order("sort_order").then(({ data }) => {
      setSubjects(data || []);
    });
  }, []);

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">GATE CSE Subjects</h2>
        <p className="text-sm text-muted-foreground">11 subjects · weighted by GATE syllabus</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search subjects…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="p-5 hover:shadow-elegant transition-all hover:-translate-y-0.5 cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">{s.weight}% weight</Badge>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-indigo-400 transition-colors">{s.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">Topics coming soon</p>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Mastery</span><span>0%</span>
            </div>
            <Progress value={0} className="h-1" />
          </Card>
        ))}
      </div>
    </div>
  );
}