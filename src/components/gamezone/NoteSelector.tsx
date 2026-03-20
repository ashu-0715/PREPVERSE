import { useState } from "react";
import { QuestionSet } from "@/types/gamezone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, HelpCircle, ArrowLeft, Play, Tag, BookOpen } from "lucide-react";
import { format } from "date-fns";

interface NoteSelectorProps {
  questionSets: QuestionSet[];
  gameMode: string;
  gameTitle: string;
  onSelect: (setId: string, selectedTopics?: string[]) => void;
  onBack: () => void;
}

type PlayMode = "full" | "topicwise";

const NoteSelector = ({ questionSets, gameMode, gameTitle, onSelect, onBack }: NoteSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const selectedSet = questionSets.find(s => s.id === selectedId);
  const availableTopics = selectedSet?.topics || [];

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = () => {
    if (!selectedId) return;
    if (playMode === "topicwise" && selectedTopics.length > 0) {
      onSelect(selectedId, selectedTopics);
    } else {
      onSelect(selectedId);
    }
  };

  // Step 2: Choose play mode & topics
  if (selectedId && playMode === null) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedId(null); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">How do you want to play?</h2>
              <p className="text-sm text-muted-foreground truncate">
                {selectedSet?.title}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card
                className="p-5 cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-lg transition-all"
                onClick={() => { setPlayMode("full"); }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Play Full Revision</h3>
                    <p className="text-sm text-muted-foreground">
                      All {selectedSet?.total_questions} questions across every topic
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {availableTopics.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card
                  className="p-5 cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-lg transition-all"
                  onClick={() => setPlayMode("topicwise")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Play Topic-wise</h3>
                      <p className="text-sm text-muted-foreground">
                        Pick specific topics to focus on ({availableTopics.length} available)
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Topic selection (topicwise mode)
  if (selectedId && playMode === "topicwise") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setPlayMode(null); setSelectedTopics([]); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Select Topics</h2>
              <p className="text-sm text-muted-foreground">
                Choose which topics to include in your game
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTopics([...availableTopics])}
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTopics([])}
            >
              Clear All
            </Button>
          </div>

          <div className="grid gap-2">
            {availableTopics.map((topic, i) => {
              const isChecked = selectedTopics.includes(topic);
              return (
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      isChecked
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                    onClick={() => toggleTopic(topic)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} onCheckedChange={() => toggleTopic(topic)} />
                      <span className="font-medium text-sm">{topic}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {selectedTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex justify-center pt-4"
              >
                <Button size="lg" className="gap-2 px-8 text-lg" onClick={handleStart}>
                  <Play className="w-5 h-5" />
                  Play {selectedTopics.length} Topic{selectedTopics.length > 1 ? "s" : ""}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Full revision: auto-start
  if (selectedId && playMode === "full") {
    handleStart();
    return null;
  }

  // Step 1: Note selection
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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

        <div className="grid md:grid-cols-2 gap-4">
          {questionSets.map((set, i) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-2 border-transparent hover:border-primary/30"
                onClick={() => setSelectedId(set.id)}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted">
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
                        {set.topics.length > 4 && (
                          <Badge variant="outline" className="text-[10px]">+{set.topics.length - 4}</Badge>
                        )}
                      </div>
                    )}
                    <Badge variant="outline" className="mt-2 text-[10px] capitalize">{set.difficulty}</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteSelector;
