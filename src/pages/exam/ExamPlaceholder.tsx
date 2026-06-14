import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function ExamPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="p-10 text-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <Badge className="mb-3 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Coming in Phase 2</Badge>
        <h3 className="text-lg font-semibold">This module is being prepared</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
          The architecture is ready. AI-powered features for {title.toLowerCase()} will roll out next.
        </p>
      </Card>
    </div>
  );
}