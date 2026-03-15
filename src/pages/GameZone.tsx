import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuestionSet } from "@/types/gamezone";
import UploadSection from "@/components/gamezone/UploadSection";
import SurvivalMode from "@/components/gamezone/SurvivalMode";
import QuizBattle from "@/components/gamezone/QuizBattle";
import GameDashboard from "@/components/gamezone/GameDashboard";
import { motion } from "framer-motion";
import {
  Gamepad2, ArrowLeft, Swords, Shield, BookOpen, Upload, Trophy,
  Zap, Play, Trash2
} from "lucide-react";
import { toast } from "sonner";

const GameZone = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Player");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();
      if (profile) setUserName((profile as any).full_name || "Player");

      await fetchQuestionSets(session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchQuestionSets = async (uid: string) => {
    const { data } = await supabase
      .from("game_question_sets")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setQuestionSets(data as unknown as QuestionSet[]);
  };

  const handleUploadComplete = useCallback(async (data: any) => {
    if (userId) {
      await fetchQuestionSets(userId);
    }
  }, [userId]);

  const deleteSet = async (setId: string) => {
    const { error } = await supabase
      .from("game_question_sets")
      .delete()
      .eq("id", setId);
    if (!error && userId) {
      toast.success("Question set deleted");
      await fetchQuestionSets(userId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!userId) return null;

  // Active game modes
  if (activeGame === "survival" && selectedSetId) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <SurvivalMode
          questionSetId={selectedSetId}
          userId={userId}
          onExit={() => { setActiveGame(null); setSelectedSetId(null); }}
        />
      </div>
    );
  }

  if (activeGame === "battle") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <QuizBattle
          userId={userId}
          userName={userName}
          questionSets={questionSets}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  const gameModes = [
    {
      id: "battle",
      title: "Quiz Battle",
      description: "Challenge friends in real-time quiz battles",
      icon: Swords,
      color: "from-orange-500 to-red-500",
      badge: "Multiplayer",
      needsSet: false,
    },
    {
      id: "survival",
      title: "Survival Mode",
      description: "Answer questions until you run out of lives",
      icon: Shield,
      color: "from-green-500 to-emerald-500",
      badge: "Solo",
      needsSet: true,
    },
    {
      id: "topic",
      title: "Topic Challenge",
      description: "Master topics one level at a time",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      badge: "Coming Soon",
      needsSet: true,
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Game Zone
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="play" className="gap-1">
              <Play className="w-4 h-4" /> Play
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1">
              <Upload className="w-4 h-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1">
              <Trophy className="w-4 h-4" /> Stats
            </TabsTrigger>
          </TabsList>

          {/* Play Tab */}
          <TabsContent value="play" className="space-y-8 mt-6">
            {/* Game Modes */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Game Modes
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {gameModes.map((mode, i) => (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card
                      className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 ${
                        mode.disabled ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      onClick={() => {
                        if (mode.disabled) return;
                        if (mode.needsSet && questionSets.length === 0) {
                          toast.error("Upload study material first!");
                          return;
                        }
                        if (mode.needsSet) {
                          setSelectedSetId(questionSets[0].id);
                        }
                        setActiveGame(mode.id);
                      }}
                    >
                      <div className={`bg-gradient-to-br ${mode.color} p-6 text-white`}>
                        <mode.icon className="w-10 h-10 mb-3" />
                        <h3 className="text-lg font-bold">{mode.title}</h3>
                        <p className="text-white/80 text-sm mt-1">{mode.description}</p>
                        <Badge className="mt-3 bg-white/20 text-white border-0">{mode.badge}</Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* My Question Sets */}
            {questionSets.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">My Study Materials</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {questionSets.map((set, i) => (
                    <motion.div
                      key={set.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm truncate">{set.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {set.total_questions} questions · {set.difficulty}
                            </p>
                            {set.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {set.topics.slice(0, 3).map(t => (
                                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSetId(set.id);
                                setActiveGame("survival");
                              }}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSet(set.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-6">
            <UploadSection onUploadComplete={handleUploadComplete} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-6">
            <GameDashboard userId={userId} userName={userName} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GameZone;
