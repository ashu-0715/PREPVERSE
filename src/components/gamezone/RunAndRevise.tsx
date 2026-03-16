import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameQuestion } from "@/types/gamezone";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Heart, Zap, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RunAndReviseProps {
  questionSetId: string;
  userId: string;
  onExit: () => void;
}

interface Obstacle {
  x: number;
  lane: number;
  type: "question" | "coin" | "heart";
  passed: boolean;
  id: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const LANE_COUNT = 3;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;
const OBSTACLE_SIZE = 36;
const GROUND_Y = CANVAS_HEIGHT - 80;

const RunAndRevise = ({ questionSetId, userId, onExit }: RunAndReviseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const gameStateRef = useRef({
    playerLane: 1,
    targetLane: 1,
    playerX: 0,
    playerY: GROUND_Y - PLAYER_SIZE,
    isJumping: false,
    jumpVelocity: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    speed: 3,
    distance: 0,
    score: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    coins: 0,
    obstacleIdCounter: 0,
    frameCount: 0,
    groundOffset: 0,
    bgStars: [] as { x: number; y: number; size: number; speed: number }[],
  });

  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayLives, setDisplayLives] = useState(3);
  const [displayStreak, setDisplayStreak] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [finalStats, setFinalStats] = useState({ score: 0, distance: 0, maxStreak: 0, coins: 0 });

  const isPausedRef = useRef(false);

  // Load questions
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("game_questions")
        .select("*")
        .eq("question_set_id", questionSetId);
      if (data && data.length > 0) {
        const shuffled = (data as unknown as GameQuestion[]).sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [questionSetId]);

  // Init background stars
  useEffect(() => {
    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (GROUND_Y - 60),
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    }));
    gameStateRef.current.bgStars = stars;
  }, []);

  const getLaneX = (lane: number) => {
    const laneWidth = CANVAS_WIDTH / LANE_COUNT;
    return laneWidth * lane + laneWidth / 2;
  };

  const addParticles = (x: number, y: number, color: string, count: number = 8) => {
    const gs = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      gs.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1) * 5,
        life: 1,
        color,
      });
    }
  };

  const spawnObstacle = useCallback(() => {
    const gs = gameStateRef.current;
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const rand = Math.random();
    let type: Obstacle["type"] = "question";
    if (rand > 0.7) type = "coin";
    else if (rand > 0.9 && gs.lives < 3) type = "heart";

    gs.obstacles.push({
      x: CANVAS_WIDTH + 50,
      lane,
      type,
      passed: false,
      id: gs.obstacleIdCounter++,
    });
  }, []);

  const triggerQuestion = useCallback(() => {
    if (questionIndex >= questions.length) {
      setQuestionIndex(0);
    }
    const q = questions[questionIndex % questions.length];
    setCurrentQuestion(q);
    setShowQuestion(true);
    isPausedRef.current = true;
  }, [questions, questionIndex]);

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuestion) return;
    const gs = gameStateRef.current;
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      const points = 200 + gs.streak * 25;
      gs.score += points;
      gs.streak++;
      gs.maxStreak = Math.max(gs.maxStreak, gs.streak);
      gs.speed = Math.min(8, gs.speed + 0.15);
      addParticles(gs.playerX, gs.playerY, "#22c55e", 15);
      toast.success(`+${points} points! 🔥`, { duration: 1500 });
    } else {
      gs.lives--;
      gs.streak = 0;
      addParticles(gs.playerX, gs.playerY, "#ef4444", 15);
      toast.error("Wrong answer! ❌", { duration: 1500 });
      if (gs.lives <= 0) {
        setGameOver(true);
        setFinalStats({
          score: gs.score,
          distance: Math.floor(gs.distance),
          maxStreak: gs.maxStreak,
          coins: gs.coins,
        });
        saveStats(gs);
        return;
      }
    }

    setDisplayScore(gs.score);
    setDisplayLives(gs.lives);
    setDisplayStreak(gs.streak);
    setQuestionIndex(prev => prev + 1);
    setShowQuestion(false);
    isPausedRef.current = false;
  }, [currentQuestion]);

  const saveStats = async (gs: typeof gameStateRef.current) => {
    try {
      const { data: existing } = await supabase
        .from("user_game_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existing) {
        await supabase.from("user_game_stats").update({
          total_xp: (existing as any).total_xp + gs.score,
          games_played: (existing as any).games_played + 1,
          longest_streak: Math.max((existing as any).longest_streak, gs.maxStreak),
        }).eq("user_id", userId);
      } else {
        await supabase.from("user_game_stats").insert({
          user_id: userId,
          total_xp: gs.score,
          games_played: 1,
          longest_streak: gs.maxStreak,
        });
      }
      toast.success(`+${gs.score} XP earned!`);
    } catch (e) {
      console.error("Failed to save stats:", e);
    }
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const render = () => {
      const gs = gameStateRef.current;

      if (!isPausedRef.current) {
        gs.frameCount++;
        gs.distance += gs.speed * 0.1;
        gs.groundOffset = (gs.groundOffset + gs.speed) % 40;

        // Smooth lane transition
        const targetX = getLaneX(gs.targetLane);
        gs.playerX += (targetX - gs.playerX) * 0.15;
        gs.playerLane = gs.targetLane;

        // Jumping
        if (gs.isJumping) {
          gs.jumpVelocity += 0.8;
          gs.playerY += gs.jumpVelocity;
          if (gs.playerY >= GROUND_Y - PLAYER_SIZE) {
            gs.playerY = GROUND_Y - PLAYER_SIZE;
            gs.isJumping = false;
            gs.jumpVelocity = 0;
          }
        }

        // Spawn obstacles
        if (gs.frameCount % Math.max(60, 120 - Math.floor(gs.distance / 10)) === 0) {
          spawnObstacle();
        }

        // Move obstacles
        gs.obstacles = gs.obstacles.filter(obs => {
          obs.x -= gs.speed * 2;
          if (obs.x < -50) return false;

          // Collision detection
          const obsX = obs.x;
          const obsY = GROUND_Y - OBSTACLE_SIZE;
          const playerCenterX = gs.playerX;
          const obsCenterX = obsX;
          const obsLaneX = getLaneX(obs.lane);

          if (
            !obs.passed &&
            Math.abs(playerCenterX - obsLaneX) < PLAYER_SIZE * 0.8 &&
            Math.abs(obsX - gs.playerX) < PLAYER_SIZE &&
            gs.playerY + PLAYER_SIZE > obsY
          ) {
            obs.passed = true;
            if (obs.type === "question") {
              triggerQuestion();
            } else if (obs.type === "coin") {
              gs.coins++;
              gs.score += 50;
              addParticles(obsX, obsY, "#eab308", 10);
              setDisplayCoins(gs.coins);
              setDisplayScore(gs.score);
            } else if (obs.type === "heart") {
              gs.lives = Math.min(3, gs.lives + 1);
              addParticles(obsX, obsY, "#ef4444", 10);
              setDisplayLives(gs.lives);
            }
            return obs.type === "question";
          }
          return true;
        });

        // Update particles
        gs.particles = gs.particles.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.life -= 0.025;
          return p.life > 0;
        });
      }

      // === DRAW ===
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, "#0f0a1e");
      skyGrad.addColorStop(0.5, "#1a1035");
      skyGrad.addColorStop(1, "#2d1b69");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars
      gs.bgStars.forEach(star => {
        if (!isPausedRef.current) {
          star.x -= star.speed * gs.speed * 0.3;
          if (star.x < 0) star.x = CANVAS_WIDTH;
        }
        ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(gs.frameCount * 0.02 + star.y) * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mountains silhouette
      ctx.fillStyle = "#1a0f2e";
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      for (let x = 0; x <= CANVAS_WIDTH; x += 60) {
        ctx.lineTo(x, GROUND_Y - 40 - Math.sin(x * 0.01 + gs.distance * 0.01) * 30);
      }
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
      ctx.fill();

      // Ground
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      groundGrad.addColorStop(0, "#4a1d96");
      groundGrad.addColorStop(1, "#2d1160");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Ground lines (moving)
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 1;
      for (let x = -gs.groundOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Lane markers
      for (let i = 1; i < LANE_COUNT; i++) {
        const lx = (CANVAS_WIDTH / LANE_COUNT) * i;
        ctx.strokeStyle = "rgba(167, 139, 250, 0.2)";
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(lx, GROUND_Y - 80);
        ctx.lineTo(lx, GROUND_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw obstacles
      gs.obstacles.forEach(obs => {
        if (obs.passed) return;
        const ox = obs.x;
        const oy = GROUND_Y - OBSTACLE_SIZE - 4;

        if (obs.type === "question") {
          // Question block - glowing purple cube
          const glow = ctx.createRadialGradient(ox, oy + OBSTACLE_SIZE / 2, 5, ox, oy + OBSTACLE_SIZE / 2, OBSTACLE_SIZE);
          glow.addColorStop(0, "rgba(168, 85, 247, 0.4)");
          glow.addColorStop(1, "rgba(168, 85, 247, 0)");
          ctx.fillStyle = glow;
          ctx.fillRect(ox - OBSTACLE_SIZE, oy - OBSTACLE_SIZE / 2, OBSTACLE_SIZE * 2, OBSTACLE_SIZE * 2);

          ctx.fillStyle = "#a855f7";
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 2;
          const s = OBSTACLE_SIZE * 0.8;
          ctx.fillRect(ox - s / 2, oy, s, s);
          ctx.strokeRect(ox - s / 2, oy, s, s);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.fillText("?", ox, oy + s / 2 + 7);
        } else if (obs.type === "coin") {
          // Coin - spinning golden circle
          const coinBounce = Math.sin(gs.frameCount * 0.1 + obs.id) * 4;
          ctx.fillStyle = "#eab308";
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ox, oy + OBSTACLE_SIZE / 2 + coinBounce, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#854d0e";
          ctx.font = "bold 14px monospace";
          ctx.textAlign = "center";
          ctx.fillText("$", ox, oy + OBSTACLE_SIZE / 2 + 5 + coinBounce);
        } else if (obs.type === "heart") {
          const hBounce = Math.sin(gs.frameCount * 0.08 + obs.id) * 3;
          ctx.fillStyle = "#ef4444";
          ctx.font = "28px serif";
          ctx.textAlign = "center";
          ctx.fillText("❤️", ox, oy + OBSTACLE_SIZE / 2 + 8 + hBounce);
        }
      });

      // Draw player (running character)
      const px = gs.playerX;
      const py = gs.playerY;
      const bobble = isPausedRef.current ? 0 : Math.sin(gs.frameCount * 0.2) * 3;

      // Player glow
      const playerGlow = ctx.createRadialGradient(px, py + PLAYER_SIZE / 2, 5, px, py + PLAYER_SIZE / 2, PLAYER_SIZE * 1.5);
      playerGlow.addColorStop(0, "rgba(59, 130, 246, 0.3)");
      playerGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(px, py + PLAYER_SIZE / 2, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(px, py + 12 + bobble, 14, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(px, py - 2 + bobble, 10, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(px + 3, py - 4 + bobble, 2, 0, Math.PI * 2);
      ctx.fill();

      // Running legs
      const legAngle = Math.sin(gs.frameCount * 0.25) * 0.6;
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      // Left leg
      ctx.beginPath();
      ctx.moveTo(px - 4, py + 22 + bobble);
      ctx.lineTo(px - 4 + Math.sin(legAngle) * 12, py + PLAYER_SIZE + bobble);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 22 + bobble);
      ctx.lineTo(px + 4 + Math.sin(-legAngle) * 12, py + PLAYER_SIZE + bobble);
      ctx.stroke();

      // Trail effect
      if (!isPausedRef.current) {
        ctx.fillStyle = `rgba(59, 130, 246, ${0.1 + Math.sin(gs.frameCount * 0.1) * 0.05})`;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(px - i * 15, py + 15, 8 - i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Particles
      gs.particles.forEach(p => {
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.life * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distance marker
      setDisplayDistance(Math.floor(gs.distance));

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameStarted, gameOver, spawnObstacle, triggerQuestion]);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKey = (e: KeyboardEvent) => {
      if (isPausedRef.current) return;
      const gs = gameStateRef.current;
      if (e.key === "ArrowLeft" || e.key === "a") {
        gs.targetLane = Math.max(0, gs.targetLane - 1);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        gs.targetLane = Math.min(LANE_COUNT - 1, gs.targetLane + 1);
      } else if ((e.key === "ArrowUp" || e.key === "w" || e.key === " ") && !gs.isJumping) {
        gs.isJumping = true;
        gs.jumpVelocity = -12;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameStarted, gameOver]);

  // Touch controls
  const handleLaneClick = (lane: number) => {
    if (isPausedRef.current || !gameStarted || gameOver) return;
    gameStateRef.current.targetLane = lane;
  };

  const startGame = () => {
    const gs = gameStateRef.current;
    gs.playerLane = 1;
    gs.targetLane = 1;
    gs.playerX = getLaneX(1);
    gs.playerY = GROUND_Y - PLAYER_SIZE;
    gs.isJumping = false;
    gs.jumpVelocity = 0;
    gs.obstacles = [];
    gs.particles = [];
    gs.speed = 3;
    gs.distance = 0;
    gs.score = 0;
    gs.lives = 3;
    gs.streak = 0;
    gs.maxStreak = 0;
    gs.coins = 0;
    gs.frameCount = 0;
    gs.groundOffset = 0;
    setDisplayScore(0);
    setDisplayLives(3);
    setDisplayStreak(0);
    setDisplayCoins(0);
    setDisplayDistance(0);
    setQuestionIndex(0);
    setGameOver(false);
    setShowQuestion(false);
    isPausedRef.current = false;
    setGameStarted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <Card className="p-8">
          <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">No Questions Found</h2>
          <p className="text-muted-foreground mb-4">Upload study material first to play Run & Revise.</p>
          <Button onClick={onExit}>Back to Game Zone</Button>
        </Card>
      </div>
    );
  }

  if (gameOver) {
    return (
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg mx-auto">
        <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border-violet-500/20">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
          </motion.div>
          <h2 className="text-3xl font-bold">Run Over!</h2>
          <p className="text-muted-foreground">You ran {finalStats.distance}m! 🏃</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-primary">{finalStats.score}</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-orange-500">{finalStats.maxStreak}🔥</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-yellow-500">{finalStats.coins}</p>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-green-500">{finalStats.distance}m</p>
              <p className="text-sm text-muted-foreground">Distance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={startGame} size="lg" className="flex-1">Play Again</Button>
            <Button onClick={onExit} variant="outline" size="lg" className="flex-1">Exit</Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!gameStarted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <Card className="p-8 text-center space-y-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20">
          <div className="text-6xl">🏃‍♂️</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Run & Revise
          </h2>
          <p className="text-muted-foreground">
            Run through an endless track! Hit question blocks to answer quiz questions.
            Wrong answers cost lives. How far can you go?
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-card border">
              <span className="text-lg">⬅️➡️</span>
              <p className="text-muted-foreground mt-1">Switch lanes</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <span className="text-lg">⬆️</span>
              <p className="text-muted-foreground mt-1">Jump</p>
            </div>
            <div className="p-3 rounded-lg bg-card border">
              <span className="text-lg">❓</span>
              <p className="text-muted-foreground mt-1">Answer to survive</p>
            </div>
          </div>
          <Button onClick={startGame} size="lg" className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600">
            Start Running! 🚀
          </Button>
          <Button variant="ghost" onClick={onExit}>Back to Game Zone</Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-[650px] mx-auto space-y-4">
      {/* HUD */}
      <div className="flex items-center justify-between px-2">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-6 h-6 ${i < displayLives ? "text-red-500 fill-red-500" : "text-muted-foreground/20"}`} />
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3 text-orange-500" />{displayStreak}x
          </Badge>
          <Badge variant="secondary" className="gap-1">🪙 {displayCoins}</Badge>
          <Badge className="gap-1 bg-primary">{displayScore} pts</Badge>
          <Badge variant="outline">{displayDistance}m</Badge>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-violet-500/30 shadow-lg shadow-violet-500/10">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full bg-black"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Question overlay */}
        <AnimatePresence>
          {showQuestion && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-card rounded-xl p-6 max-w-md w-full space-y-4 border border-violet-500/30">
                <Badge variant="outline" className="mb-2">
                  {currentQuestion.question_type === "mcq" ? "MCQ" : currentQuestion.question_type === "true_false" ? "True/False" : "Fill Blank"}
                </Badge>
                <h3 className="font-semibold text-base">{currentQuestion.question_text}</h3>
                <div className="grid gap-2">
                  {currentQuestion.options.map((opt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 hover:border-violet-500 hover:bg-violet-500/10"
                      onClick={() => handleAnswer(opt)}
                    >
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold mr-2 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile lane controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {[0, 1, 2].map(lane => (
          <Button
            key={lane}
            variant="outline"
            className="h-14 text-lg border-violet-500/30"
            onClick={() => handleLaneClick(lane)}
          >
            {lane === 0 ? "⬅️" : lane === 1 ? "⬆️" : "➡️"}
          </Button>
        ))}
      </div>

      <Button variant="ghost" onClick={onExit} className="w-full">Exit Game</Button>
    </div>
  );
};

export default RunAndRevise;
