import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GameQuestion } from "@/types/gamezone";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Trophy, Timer, CheckCircle, XCircle, SkipForward } from "lucide-react";
import { toast } from "sonner";

interface SurvivalModeProps {
  questionSetId: string;
  onExit: () => void;
  userId: string;
}

const SurvivalMode = ({ questionSetId, onExit, userId }: SurvivalModeProps) => {
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("game_questions")
        .select("*")
        .eq("question_set_id", questionSetId);
      if (data) {
        // Shuffle questions
        const shuffled = (data as unknown as GameQuestion[]).sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [questionSetId]);

  // Timer
  useEffect(() => {
    if (gameOver || showResult || loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer("__timeout__");
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, showResult, loading, currentIndex]);

  const handleAnswer = useCallback((answer: string) => {
    if (showResult || gameOver) return;
    const question = questions[currentIndex];
    if (!question) return;

    const isCorrect = answer === question.correct_answer;
    setSelectedAnswer(answer);
    setShowResult(true);

    if (isCorrect) {
      const points = 100 + streak * 10 + Math.floor(timeLeft * 5);
      setScore(prev => prev + points);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(ms => Math.max(ms, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
    }

    setTimeout(() => {
      if (!isCorrect && lives <= 1) return; // game over
      setShowResult(false);
      setSelectedAnswer(null);
      setTimeLeft(15);
      setCurrentIndex(prev => {
        if (prev + 1 >= questions.length) {
          setGameOver(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  }, [showResult, gameOver, questions, currentIndex, streak, timeLeft, lives]);

  const saveStats = useCallback(async () => {
    try {
      // Upsert game stats
      const { data: existing } = await supabase
        .from("user_game_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existing) {
        await supabase
          .from("user_game_stats")
          .update({
            total_xp: (existing as any).total_xp + score,
            games_played: (existing as any).games_played + 1,
            total_correct: (existing as any).total_correct + (currentIndex - (3 - lives)),
            total_answered: (existing as any).total_answered + currentIndex,
            longest_streak: Math.max((existing as any).longest_streak, maxStreak),
          })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("user_game_stats")
          .insert({
            user_id: userId,
            total_xp: score,
            games_played: 1,
            total_correct: currentIndex - (3 - lives),
            total_answered: currentIndex,
            longest_streak: maxStreak,
          });
      }
      toast.success(`+${score} XP earned!`);
    } catch (e) {
      console.error("Failed to save stats:", e);
    }
  }, [userId, score, currentIndex, lives, maxStreak]);

  useEffect(() => {
    if (gameOver) saveStats();
  }, [gameOver]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const question = questions[currentIndex];

  if (gameOver) {
    const accuracy = currentIndex > 0 ? Math.round(((currentIndex - (3 - Math.max(0, lives))) / currentIndex) * 100) : 0;
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg mx-auto">
        <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-primary/10 to-accent/10">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
          </motion.div>
          <h2 className="text-3xl font-bold">Game Over!</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="text-2xl font-bold text-orange-500">{maxStreak}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="text-2xl font-bold text-green-500">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="text-2xl font-bold">{currentIndex}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </div>
          <Button onClick={onExit} size="lg" className="w-full">Back to Game Zone</Button>
        </Card>
      </motion.div>
    );
  }

  if (!question) return null;

  const timerPercent = (timeLeft / 15) * 100;
  const timerColor = timeLeft > 10 ? "text-green-500" : timeLeft > 5 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HUD */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} animate={i >= lives ? { scale: [1, 0], opacity: 0 } : {}}>
              <Heart className={`w-8 h-8 ${i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground/20"}`} />
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-orange-500">{streak}x</span>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {score} pts
          </Badge>
        </div>
      </div>

      {/* Timer */}
      <div className="relative">
        <Progress value={timerPercent} className="h-2" />
        <div className={`absolute right-0 -top-6 font-mono font-bold ${timerColor}`}>
          <Timer className="w-4 h-4 inline mr-1" />{timeLeft}s
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">{question.question_type === "mcq" ? "MCQ" : question.question_type === "true_false" ? "True/False" : "Fill Blank"}</Badge>
              <span className="text-sm text-muted-foreground">Q{currentIndex + 1}/{questions.length}</span>
            </div>
            <h3 className="text-lg font-semibold mb-6">{question.question_text}</h3>

            <div className="grid gap-3">
              {question.options.map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === question.correct_answer;
                let variant = "outline";
                let extraClass = "hover:border-primary hover:bg-primary/5";

                if (showResult) {
                  if (isCorrect) {
                    variant = "default";
                    extraClass = "bg-green-500 border-green-500 text-white hover:bg-green-500";
                  } else if (isSelected && !isCorrect) {
                    extraClass = "bg-red-500 border-red-500 text-white hover:bg-red-500";
                  } else {
                    extraClass = "opacity-50";
                  }
                }

                return (
                  <motion.div
                    key={i}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left h-auto py-4 px-6 text-base ${extraClass}`}
                      onClick={() => handleAnswer(option)}
                      disabled={showResult}
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                      {showResult && isCorrect && <CheckCircle className="w-5 h-5 ml-auto text-white" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 ml-auto text-white" />}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {showResult && question.explanation && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-muted text-sm"
              >
                💡 {question.explanation}
              </motion.p>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      <Button variant="ghost" onClick={onExit} className="w-full">Exit Game</Button>
    </div>
  );
};

export default SurvivalMode;
