import { useState } from "react";
import { QuestionSet } from "@/types/gamezone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, HelpCircle, ArrowLeft, Play, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface NoteSelectorProps {
  questionSets: QuestionSet[];
  gameMode: string;
  gameTitle: string;
  onSelect: (setId: string) => void;
  onBack: () => void;
}

const NoteSelector = ({ questionSets, gameMode, gameTitle, onSelect, onBack }: NoteSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Select Study Material</h2>
            <p className="text-sm text-muted-foreground">
              Choose notes for <span className="text-primary font-semibold">{gameTitle}</span>
            </p>
          </div>
        </div>

        {/* Note Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {questionSets.map((set, i) => {
            const isSelected = selectedId === set.id;
            return (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-2 ${
                    isSelected
                      ? "border-primary shadow-primary/20 shadow-lg bg-primary/5"
                      : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedId(set.id)}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{set.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          {set.total_questions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(set.created_at), "MMM d")}
                        </span>
                      </div>
                      {set.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {set.topics.slice(0, 4).map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                      <Badge variant="outline" className="mt-2 text-[10px] capitalize">{set.difficulty}</Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Start Button */}
        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center pt-4"
            >
              <Button
                size="lg"
                className="gap-2 px-8 text-lg"
                onClick={() => onSelect(selectedId)}
              >
                <Play className="w-5 h-5" /> Start {gameTitle}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NoteSelector;
