import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useGameRoom } from "@/hooks/useGameRoom";
import { QuestionSet, GameRoom } from "@/types/gamezone";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Copy, Play, Crown, CheckCircle, XCircle, Timer, Zap, Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface QuizBattleProps {
  userId: string;
  userName: string;
  questionSets: QuestionSet[];
  onExit: () => void;
}

const QuizBattle = ({ userId, userName, questionSets, onExit }: QuizBattleProps) => {
  const [view, setView] = useState<"lobby" | "room">("lobby");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [isHost, setIsHost] = useState(false);

  const { room, players, currentQuestion, timeLeft, myPlayer, submitAnswer, nextQuestion } = useGameRoom({
    roomId: roomId || undefined,
    userId,
  });

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    if (!selectedSetId) {
      toast.error("Please select a question set");
      return;
    }

    const roomCode = generateRoomCode();
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({
        host_id: userId,
        room_code: roomCode,
        question_set_id: selectedSetId,
        status: "waiting",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create room");
      return;
    }

    // Join as player
    await supabase.from("game_players").insert({
      room_id: (data as any).id,
      user_id: userId,
      display_name: userName,
    });

    setRoomId((data as any).id);
    setIsHost(true);
    setView("room");
    toast.success(`Room created! Code: ${roomCode}`);
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error("Enter a room code");
      return;
    }

    const { data: roomData, error } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", joinCode.toUpperCase())
      .eq("status", "waiting")
      .single();

    if (error || !roomData) {
      toast.error("Room not found or already started");
      return;
    }

    const { error: joinError } = await supabase.from("game_players").insert({
      room_id: (roomData as any).id,
      user_id: userId,
      display_name: userName,
    });

    if (joinError) {
      toast.error("Failed to join room");
      return;
    }

    setRoomId((roomData as any).id);
    setIsHost(false);
    setView("room");
    toast.success("Joined room!");
  };

  const startGame = async () => {
    if (!roomId) return;
    await supabase
      .from("game_rooms")
      .update({ status: "playing", started_at: new Date().toISOString() })
      .eq("id", roomId);
  };

  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(answer);
    setShowResult(true);

    const result = await submitAnswer(answer, (20 - timeLeft) * 1000);
    setAnswerResult(result || null);

    // Auto advance after delay (host only)
    if (isHost) {
      setTimeout(() => {
        setShowResult(false);
        setSelectedAnswer(null);
        setAnswerResult(null);
        nextQuestion();
      }, 3000);
    }
  };

  // Reset answer state when question changes
  useEffect(() => {
    setShowResult(false);
    setSelectedAnswer(null);
    setAnswerResult(null);
  }, [currentQuestion?.id]);

  // Lobby
  if (view === "lobby") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onExit}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold">Quiz Battle</h2>
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">Multiplayer</Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold">Create Room</h3>
            </div>
            <p className="text-sm text-muted-foreground">Host a quiz battle with your study material</p>
            
            {questionSets.length > 0 ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Material</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {questionSets.map(set => (
                    <div
                      key={set.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSetId === set.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedSetId(set.id)}
                    >
                      <p className="font-medium text-sm">{set.title}</p>
                      <p className="text-xs text-muted-foreground">{set.total_questions} questions</p>
                    </div>
                  ))}
                </div>
                <Button onClick={createRoom} className="w-full" disabled={!selectedSetId}>
                  <Play className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Upload study material first to create a room</p>
            )}
          </Card>

          {/* Join Room */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Join Room</h3>
            </div>
            <p className="text-sm text-muted-foreground">Enter a room code to join a friend's quiz</p>
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
            />
            <Button onClick={joinRoom} className="w-full" variant="secondary" disabled={joinCode.length < 4}>
              <Users className="w-4 h-4 mr-2" />
              Join Room
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Game Room - Waiting
  if (room?.status === "waiting") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="p-8 text-center space-y-6">
          <h2 className="text-2xl font-bold">Waiting Room</h2>
          <div className="p-4 rounded-xl bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Room Code</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-mono font-bold tracking-widest text-primary">{room.room_code}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(room.room_code);
                  toast.success("Code copied!");
                }}
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Players ({players.length})</p>
            <div className="space-y-2">
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-sm">
                      {player.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.display_name}</span>
                  {player.user_id === room.host_id && (
                    <Crown className="w-4 h-4 text-yellow-500 ml-auto" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {isHost && players.length >= 1 && (
            <Button onClick={startGame} size="lg" className="w-full">
              <Play className="w-5 h-5 mr-2" />
              Start Battle ({players.length} players)
            </Button>
          )}

          <Button variant="ghost" onClick={onExit}>Leave Room</Button>
        </Card>
      </div>
    );
  }

  // Game Room - Playing
  if (room?.status === "playing" && currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Scoreboard */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {players.sort((a, b) => b.score - a.score).map((player, i) => (
            <Badge
              key={player.id}
              variant={player.user_id === userId ? "default" : "secondary"}
              className="shrink-0 py-1.5"
            >
              {i === 0 && <Crown className="w-3 h-3 mr-1 text-yellow-400" />}
              {player.display_name}: {player.score}
              {player.streak > 1 && <Zap className="w-3 h-3 ml-1 text-orange-400" />}
            </Badge>
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${timeLeft <= 5 ? "text-red-500" : "text-muted-foreground"}`} />
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timeLeft <= 5 ? "bg-red-500" : "bg-primary"}`}
              animate={{ width: `${(timeLeft / (room?.question_timer || 20)) * 100}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold">{timeLeft}s</span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">{currentQuestion.question_text}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correct_answer;
                  let bg = "hover:border-primary hover:bg-primary/5";

                  if (showResult) {
                    if (isCorrect) bg = "bg-green-500 border-green-500 text-white";
                    else if (isSelected) bg = "bg-red-500 border-red-500 text-white";
                    else bg = "opacity-50";
                  }

                  return (
                    <motion.div key={i} whileTap={!showResult ? { scale: 0.95 } : {}}>
                      <Button
                        variant="outline"
                        className={`w-full h-auto py-4 text-left ${bg}`}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                      >
                        {option}
                        {showResult && isCorrect && <CheckCircle className="w-4 h-4 ml-auto" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 ml-auto" />}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
              {showResult && answerResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-4 p-3 rounded-lg text-center font-bold ${
                    answerResult.isCorrect ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {answerResult.isCorrect ? `+${answerResult.points} points!` : "Wrong answer!"}
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Game Over / Finished
  if (room?.status === "finished") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-8 text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold">Battle Complete!</h2>
          <div className="space-y-3">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  i === 0 ? "bg-yellow-500/10 border-2 border-yellow-500/30" : "bg-card border"
                }`}
              >
                <span className="text-2xl font-bold w-8">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{player.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {player.correct_answers}/{player.total_answered} correct
                  </p>
                </div>
                <span className="text-xl font-bold text-primary">{player.score}</span>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button onClick={onExit} className="flex-1">Back to Game Zone</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
};

export default QuizBattle;
