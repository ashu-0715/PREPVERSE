import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameQuestion } from "@/types/gamezone";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Heart, Zap, XCircle, Shield, Clock, Sparkles,
  ArrowLeft, ArrowRight, RotateCcw, Users, BarChart3, Target,
  ChevronLeft, ChevronRight, ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface RunAndReviseProps {
  questionSetId: string;
  userId: string;
  onExit: () => void;
  difficulty?: "easy" | "medium" | "hard";
}

interface AnswerGate {
  z: number;
  lane: number;
  text: string;
  isCorrect: boolean;
  passed: boolean;
  opacity: number;
}

interface PowerUp {
  z: number;
  lane: number;
  type: "freeze" | "fifty" | "shield" | "doubleXp" | "hint";
  passed: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

interface TrackParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface TopicStat {
  correct: number;
  total: number;
}

const DIFFICULTY_CONFIG = {
  easy: { speed: 2.5, speedInc: 0.08, questionTime: 20, label: "Easy", color: "#22c55e" },
  medium: { speed: 3.5, speedInc: 0.12, questionTime: 15, label: "Medium", color: "#eab308" },
  hard: { speed: 4.5, speedInc: 0.18, questionTime: 10, label: "Hard", color: "#ef4444" },
};

const POWER_UP_INFO: Record<string, { icon: string; name: string; color: string }> = {
  freeze: { icon: "❄️", name: "Freeze Time", color: "#38bdf8" },
  fifty: { icon: "✂️", name: "50/50", color: "#f59e0b" },
  shield: { icon: "🛡️", name: "Shield", color: "#a78bfa" },
  doubleXp: { icon: "⚡", name: "Double XP", color: "#f472b6" },
  hint: { icon: "💡", name: "Hint Pulse", color: "#34d399" },
};

const RunAndRevise = ({ questionSetId, userId, onExit, difficulty = "medium" }: RunAndReviseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const config = DIFFICULTY_CONFIG[difficulty];

  // Game state ref for animation loop
  const gs = useRef({
    playerLane: 1,
    targetLane: 1,
    playerX: 0,
    speed: config.speed,
    distance: 0,
    score: 0,
    xp: 0,
    lives: 3,
    streak: 0,
    maxStreak: 0,
    frame: 0,
    trackOffset: 0,
    answerGates: [] as AnswerGate[],
    powerUps: [] as PowerUp[],
    particles: [] as TrackParticle[],
    floatingTexts: [] as FloatingText[],
    currentQuestionIdx: 0,
    waitingForAnswer: false,
    questionTimer: 0,
    questionTimerMax: config.questionTime,
    answered: false,
    totalCorrect: 0,
    totalAnswered: 0,
    hasShield: false,
    doubleXpCount: 0,
    frozenTimer: 0,
    hintLane: -1,
    pauseTimer: 0,
    topicStats: {} as Record<string, TopicStat>,
    canvasW: 800,
    canvasH: 500,
    // Perspective settings
    vanishY: 120,
    horizonY: 140,
    groundY: 460,
  });

  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentQ, setCurrentQ] = useState<GameQuestion | null>(null);
  const [questionTimerDisplay, setQuestionTimerDisplay] = useState(0);
  const [hud, setHud] = useState({ score: 0, xp: 0, lives: 3, streak: 0, distance: 0, qNum: 0, qTotal: 0, topic: "" });
  const [feedback, setFeedback] = useState<{ type: "correct" | "wrong"; text: string; explanation?: string } | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [finalStats, setFinalStats] = useState({
    score: 0, xp: 0, accuracy: 0, maxStreak: 0, totalAnswered: 0, totalCorrect: 0,
    weakTopics: [] as string[], strongTopics: [] as string[],
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load questions
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("game_questions").select("*").eq("question_set_id", questionSetId);
      if (data && data.length > 0) {
        setQuestions((data as unknown as GameQuestion[]).sort(() => Math.random() - 0.5));
      }
      setLoading(false);
    };
    fetch();
  }, [questionSetId]);

  // Spawn answer gates for current question
  const spawnAnswerGates = useCallback((q: GameQuestion) => {
    const g = gs.current;
    g.answerGates = [];
    const opts = q.options.slice(0, 3);
    // Shuffle options into lanes
    const shuffled = opts.map((text, i) => ({
      text,
      isCorrect: text === q.correct_answer,
      lane: i,
    })).sort(() => Math.random() - 0.5).map((o, i) => ({ ...o, lane: i }));

    shuffled.forEach(o => {
      g.answerGates.push({
        z: 800,
        lane: o.lane,
        text: o.text,
        isCorrect: o.isCorrect,
        passed: false,
        opacity: 1,
      });
    });
    g.waitingForAnswer = true;
    g.answered = false;
    g.pauseTimer = 5 * 60; // 5-second reading pause at 60fps
    g.questionTimer = g.questionTimerMax * 60; // starts after pause
    g.hintLane = -1;
  }, []);

  // Advance to next question
  const nextQuestion = useCallback(() => {
    const g = gs.current;
    const idx = g.currentQuestionIdx;
    if (idx >= questions.length) {
      endGame();
      return;
    }
    const q = questions[idx];
    setCurrentQ(q);
    setHud(h => ({ ...h, qNum: idx + 1, qTotal: questions.length, topic: q.topic || "General" }));
    spawnAnswerGates(q);
  }, [questions, spawnAnswerGates]);

  // Handle answer selection (when player runs through a gate)
  const processAnswer = useCallback((chosenText: string) => {
    const g = gs.current;
    if (g.answered) return;
    g.answered = true;
    g.waitingForAnswer = false;
    g.totalAnswered++;

    const q = questions[g.currentQuestionIdx];
    const isCorrect = chosenText === q?.correct_answer;
    const topic = q?.topic || "General";

    if (!g.topicStats[topic]) g.topicStats[topic] = { correct: 0, total: 0 };
    g.topicStats[topic].total++;

    if (isCorrect) {
      g.totalCorrect++;
      g.topicStats[topic].correct++;
      const basePoints = 200;
      const streakBonus = g.streak * 30;
      const multiplier = g.doubleXpCount > 0 ? 2 : 1;
      const pts = (basePoints + streakBonus) * multiplier;
      g.score += pts;
      g.xp += Math.floor(pts * 0.6);
      g.streak++;
      g.maxStreak = Math.max(g.maxStreak, g.streak);
      g.speed = Math.min(config.speed + 4, g.speed + config.speedInc);
      if (g.doubleXpCount > 0) g.doubleXpCount--;

      // Green burst particles
      for (let i = 0; i < 20; i++) {
        g.particles.push({
          x: g.playerX, y: g.groundY - 60, z: 0,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 1) * 6,
          life: 1, color: "#22c55e", size: Math.random() * 4 + 2,
        });
      }
      g.floatingTexts.push({ x: g.canvasW / 2, y: g.groundY - 100, text: `+${pts} ✓`, color: "#22c55e", life: 1.5, vy: -2 });
      setFeedback({ type: "correct", text: "Correct!", explanation: q?.explanation || undefined });
    } else {
      if (g.hasShield) {
        g.hasShield = false;
        g.floatingTexts.push({ x: g.canvasW / 2, y: g.groundY - 100, text: "Shield saved you!", color: "#a78bfa", life: 1.5, vy: -2 });
        setFeedback({ type: "wrong", text: `Shield blocked! Answer: ${q?.correct_answer}`, explanation: q?.explanation || undefined });
      } else {
        g.lives--;
        g.streak = 0;
        // Red burst
        for (let i = 0; i < 15; i++) {
          g.particles.push({
            x: g.playerX, y: g.groundY - 60, z: 0,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 1) * 5,
            life: 1, color: "#ef4444", size: Math.random() * 3 + 2,
          });
        }
        g.floatingTexts.push({ x: g.canvasW / 2, y: g.groundY - 100, text: "✗ Wrong!", color: "#ef4444", life: 1.5, vy: -2 });
        setFeedback({ type: "wrong", text: `Answer: ${q?.correct_answer}`, explanation: q?.explanation || undefined });
      }
    }

    setHud(h => ({ ...h, score: g.score, xp: g.xp, lives: g.lives, streak: g.streak }));

    // Brief pause then next question
    setTimeout(() => {
      setFeedback(null);
      if (g.lives <= 0) {
        endGame();
      } else {
        g.currentQuestionIdx++;
        g.answerGates = [];
        setTimeout(() => nextQuestion(), 300);
      }
    }, 1800);
  }, [questions, config, nextQuestion]);

  const endGame = useCallback(() => {
    const g = gs.current;
    const topicEntries = Object.entries(g.topicStats);
    const weak = topicEntries.filter(([, s]) => s.total > 0 && s.correct / s.total < 0.5).map(([t]) => t);
    const strong = topicEntries.filter(([, s]) => s.total > 0 && s.correct / s.total >= 0.7).map(([t]) => t);

    setFinalStats({
      score: g.score, xp: g.xp,
      accuracy: g.totalAnswered > 0 ? Math.round((g.totalCorrect / g.totalAnswered) * 100) : 0,
      maxStreak: g.maxStreak, totalAnswered: g.totalAnswered, totalCorrect: g.totalCorrect,
      weakTopics: weak, strongTopics: strong,
    });
    setGameOver(true);
    setGameStarted(false);
    saveStats(g);
  }, []);

  const saveStats = async (g: typeof gs.current) => {
    try {
      const { data: existing } = await supabase.from("user_game_stats").select("*").eq("user_id", userId).single();
      if (existing) {
        await supabase.from("user_game_stats").update({
          total_xp: ((existing as any).total_xp || 0) + g.xp,
          games_played: ((existing as any).games_played || 0) + 1,
          total_correct: ((existing as any).total_correct || 0) + g.totalCorrect,
          total_answered: ((existing as any).total_answered || 0) + g.totalAnswered,
          longest_streak: Math.max((existing as any).longest_streak || 0, g.maxStreak),
        }).eq("user_id", userId);
      } else {
        await supabase.from("user_game_stats").insert({
          user_id: userId, total_xp: g.xp, games_played: 1,
          total_correct: g.totalCorrect, total_answered: g.totalAnswered, longest_streak: g.maxStreak,
        });
      }
    } catch (e) { console.error("Save stats error:", e); }
  };

  // ============ PERSPECTIVE 3D RENDERING ============
  const project3D = (laneIdx: number, z: number, cw: number, ch: number) => {
    const g = gs.current;
    const perspective = 400;
    const scale = perspective / (perspective + z);
    const laneWidth = cw * 0.22;
    const cx = cw / 2;
    const laneOffset = (laneIdx - 1) * laneWidth;
    const x = cx + laneOffset * scale;
    const y = g.horizonY + (g.groundY - g.horizonY) * scale;
    return { x, y, scale };
  };

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const g = gs.current;

    // Resize canvas
    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = Math.min(rect.width, 900);
      const h = Math.min(w * 0.625, 560);
      canvas.width = w;
      canvas.height = h;
      g.canvasW = w;
      g.canvasH = h;
      g.horizonY = h * 0.25;
      g.groundY = h * 0.88;
      g.vanishY = h * 0.2;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const cw = g.canvasW;
      const ch = g.canvasH;

      g.frame++;

      // Check if paused for reading time
      const isPaused = g.pauseTimer > 0;
      if (isPaused) {
        g.pauseTimer--;
        setQuestionTimerDisplay(Math.ceil(g.pauseTimer / 60));
      }

      g.trackOffset = (g.trackOffset + (isPaused ? 0 : g.speed * 2)) % 60;

      // Movement stops during pause; slow if frozen
      const effectiveSpeed = isPaused ? 0 : (g.frozenTimer > 0 ? g.speed * 0.3 : g.speed);
      if (!isPaused && g.frozenTimer > 0) g.frozenTimer--;
      g.distance += effectiveSpeed * 0.1;

      // Lane smoothing (allow switching lanes even during pause)
      const laneWidth = cw * 0.22;
      const cx = cw / 2;
      const targetX = cx + (g.targetLane - 1) * laneWidth;
      g.playerX += (targetX - g.playerX) * 0.12;
      g.playerLane = g.targetLane;

      // Move answer gates toward player (only after pause ends)
      if (g.waitingForAnswer && !g.answered && !isPaused) {
        g.questionTimer--;
        setQuestionTimerDisplay(Math.max(0, Math.ceil(g.questionTimer / 60)));
        if (g.questionTimer <= 0) {
          processAnswer("__timeout__");
        }

        g.answerGates.forEach(gate => {
          gate.z -= effectiveSpeed * 3;
          if (!gate.passed && gate.z <= 30) {
            gate.passed = true;
            if (gate.lane === g.targetLane) {
              processAnswer(gate.text);
            }
          }
        });

        if (g.answerGates.every(ga => ga.passed) && !g.answered) {
        }
      }

      // Power-ups movement
      g.powerUps = g.powerUps.filter(pu => {
        pu.z -= effectiveSpeed * 3;
        if (!pu.passed && pu.z <= 30 && pu.lane === g.targetLane) {
          pu.passed = true;
          activatePowerUp(pu.type);
        }
        return pu.z > -100;
      });

      // Update particles
      g.particles = g.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;
        return p.life > 0;
      });

      // Update floating texts
      g.floatingTexts = g.floatingTexts.filter(ft => {
        ft.y += ft.vy;
        ft.life -= 0.02;
        return ft.life > 0;
      });

      // ============ DRAWING ============

      // Sky - deep space gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, g.horizonY + 50);
      skyGrad.addColorStop(0, "#050a18");
      skyGrad.addColorStop(0.4, "#0c1629");
      skyGrad.addColorStop(1, "#141e3a");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Twinkling stars
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5 + g.frame * 0.05 * (i % 3 + 1)) % cw);
        const sy = (i * 37.7) % (g.horizonY);
        const alpha = 0.3 + Math.sin(g.frame * 0.03 + i) * 0.3;
        ctx.fillStyle = `rgba(200,210,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, (i % 3) * 0.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant cityscape silhouette
      ctx.fillStyle = "#0d1525";
      ctx.beginPath();
      ctx.moveTo(0, g.horizonY + 20);
      for (let x = 0; x < cw; x += 25) {
        const h = 15 + Math.sin(x * 0.03) * 10 + Math.cos(x * 0.07) * 8 + (x % 50 < 20 ? 15 : 0);
        ctx.lineTo(x, g.horizonY + 20 - h);
      }
      ctx.lineTo(cw, g.horizonY + 20);
      ctx.fill();

      // Glowing city lights
      for (let x = 20; x < cw; x += 40) {
        const flicker = Math.sin(g.frame * 0.05 + x) > 0.5 ? 0.7 : 0.3;
        ctx.fillStyle = `rgba(100,180,255,${flicker * 0.3})`;
        ctx.fillRect(x, g.horizonY + 5 - (x % 50 < 20 ? 12 : 0), 2, 3);
      }

      // ============ DRAW 3D TRACK ============
      // Track background (converging to vanishing point)
      const trackLeftNear = cx - laneWidth * 2;
      const trackRightNear = cx + laneWidth * 2;
      const vanishX = cx;

      // Track fill with gradient
      const trackGrad = ctx.createLinearGradient(0, g.horizonY, 0, g.groundY);
      trackGrad.addColorStop(0, "rgba(20,10,50,0.9)");
      trackGrad.addColorStop(1, "rgba(30,15,70,0.95)");
      ctx.fillStyle = trackGrad;
      ctx.beginPath();
      ctx.moveTo(vanishX - 5, g.horizonY);
      ctx.lineTo(vanishX + 5, g.horizonY);
      ctx.lineTo(trackRightNear, g.groundY);
      ctx.lineTo(trackLeftNear, g.groundY);
      ctx.fill();

      // Track edge glow lines
      ctx.strokeStyle = "rgba(139,92,246,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vanishX - 3, g.horizonY);
      ctx.lineTo(trackLeftNear, g.groundY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(vanishX + 3, g.horizonY);
      ctx.lineTo(trackRightNear, g.groundY);
      ctx.stroke();

      // Lane dividers (perspective)
      for (let lane = 0; lane <= 3; lane++) {
        const laneX = lane - 1.5;
        ctx.strokeStyle = `rgba(167,139,250,${lane === 0 || lane === 3 ? 0.0 : 0.25})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        for (let z = 0; z <= 800; z += 20) {
          const p = project3D(laneX + 0.5, z, cw, ch);
          if (z === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Moving track lines (perspective road markings)
      for (let z = (g.trackOffset); z < 800; z += 60) {
        const p = project3D(0, z, cw, ch);
        const s = p.scale;
        if (s < 0.05) continue;
        ctx.strokeStyle = `rgba(139,92,246,${s * 0.3})`;
        ctx.lineWidth = Math.max(1, s * 2);
        const halfW = laneWidth * 2 * s;
        ctx.beginPath();
        ctx.moveTo(cx - halfW, p.y);
        ctx.lineTo(cx + halfW, p.y);
        ctx.stroke();
      }

      // ============ DRAW ANSWER GATES ============
      g.answerGates.forEach(gate => {
        if (gate.z < -50) return;
        const p = project3D(gate.lane, gate.z, cw, ch);
        const s = p.scale;
        if (s < 0.03) return;

        const gateW = laneWidth * s * 0.85;
        const gateH = 50 * s;

        // Hint glow
        const isHint = g.hintLane === gate.lane;

        // Gate arch glow
        const glowColor = gate.isCorrect && isHint
          ? "rgba(52,211,153,0.4)"
          : "rgba(139,92,246,0.35)";

        ctx.shadowColor = isHint ? "#34d399" : "#8b5cf6";
        ctx.shadowBlur = 15 * s;

        // Gate frame
        ctx.strokeStyle = isHint ? "rgba(52,211,153,0.9)" : "rgba(167,139,250,0.8)";
        ctx.lineWidth = Math.max(2, 3 * s);
        const gx = p.x - gateW / 2;
        const gy = p.y - gateH;

        // Arch shape
        ctx.beginPath();
        ctx.moveTo(gx, p.y);
        ctx.lineTo(gx, gy + 8 * s);
        ctx.quadraticCurveTo(gx, gy, gx + 8 * s, gy);
        ctx.lineTo(gx + gateW - 8 * s, gy);
        ctx.quadraticCurveTo(gx + gateW, gy, gx + gateW, gy + 8 * s);
        ctx.lineTo(gx + gateW, p.y);
        ctx.stroke();

        // Gate fill
        const gateFill = ctx.createLinearGradient(gx, gy, gx, p.y);
        gateFill.addColorStop(0, isHint ? "rgba(52,211,153,0.2)" : "rgba(88,28,235,0.25)");
        gateFill.addColorStop(1, isHint ? "rgba(52,211,153,0.05)" : "rgba(88,28,235,0.05)");
        ctx.fillStyle = gateFill;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Answer text (only if close enough to read)
        if (s > 0.15) {
          const fontSize = Math.max(10, Math.floor(14 * s));
          ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = `rgba(255,255,255,${Math.min(1, s * 2)})`;

          // Truncate long text
          let displayText = gate.text;
          const maxChars = Math.floor(gateW / (fontSize * 0.5));
          if (displayText.length > maxChars) displayText = displayText.slice(0, maxChars - 1) + "…";

          ctx.fillText(displayText, p.x, p.y - gateH / 2 + fontSize / 3);
        }

        // Lane letter label at top
        if (s > 0.2) {
          const label = ["A", "B", "C"][gate.lane];
          const lSize = Math.max(8, Math.floor(10 * s));
          ctx.font = `bold ${lSize}px monospace`;
          ctx.fillStyle = "rgba(167,139,250,0.7)";
          ctx.fillText(label, p.x, gy - 4 * s);
        }
      });

      // ============ DRAW POWER-UPS ============
      g.powerUps.forEach(pu => {
        if (pu.passed || pu.z < -50) return;
        const p = project3D(pu.lane, pu.z, cw, ch);
        const s = p.scale;
        if (s < 0.05) return;
        const info = POWER_UP_INFO[pu.type];
        const puSize = Math.max(10, 24 * s);
        const bobble = Math.sin(g.frame * 0.08 + pu.z) * 5 * s;

        ctx.shadowColor = info.color;
        ctx.shadowBlur = 12 * s;
        ctx.font = `${puSize}px serif`;
        ctx.textAlign = "center";
        ctx.fillText(info.icon, p.x, p.y - 15 * s + bobble);
        ctx.shadowBlur = 0;
      });

      // ============ DRAW PLAYER ============
      const playerY = g.groundY;
      const px = g.playerX;
      const bobble = Math.sin(g.frame * 0.15) * 3;

      // Player glow trail
      for (let i = 3; i >= 1; i--) {
        const alpha = 0.1 / i;
        ctx.fillStyle = `rgba(99,102,241,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, playerY - 25 + bobble, 20 + i * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Character body (futuristic scholar)
      // Cloak/body
      const bodyGrad = ctx.createLinearGradient(px, playerY - 55 + bobble, px, playerY + bobble);
      bodyGrad.addColorStop(0, "#6366f1");
      bodyGrad.addColorStop(1, "#4338ca");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(px - 14, playerY + bobble);
      ctx.lineTo(px - 10, playerY - 35 + bobble);
      ctx.quadraticCurveTo(px, playerY - 50 + bobble, px + 10, playerY - 35 + bobble);
      ctx.lineTo(px + 14, playerY + bobble);
      ctx.fill();

      // Head
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(px, playerY - 48 + bobble, 10, 0, Math.PI * 2);
      ctx.fill();

      // Visor/glasses
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(px - 8, playerY - 51 + bobble, 16, 5);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(px - 7, playerY - 50 + bobble, 6, 3);
      ctx.fillRect(px + 1, playerY - 50 + bobble, 6, 3);

      // Energy aura
      if (g.hasShield) {
        ctx.strokeStyle = "rgba(167,139,250,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, playerY - 25 + bobble, 25, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Running animation legs
      const legPhase = g.frame * 0.2;
      ctx.strokeStyle = "#4338ca";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      // Left leg
      ctx.beginPath();
      ctx.moveTo(px - 5, playerY - 5 + bobble);
      ctx.lineTo(px - 5 + Math.sin(legPhase) * 10, playerY + 5 + bobble);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(px + 5, playerY - 5 + bobble);
      ctx.lineTo(px + 5 + Math.sin(legPhase + Math.PI) * 10, playerY + 5 + bobble);
      ctx.stroke();

      // Speed trail
      const trailAlpha = Math.min(0.4, g.speed * 0.05);
      ctx.fillStyle = `rgba(99,102,241,${trailAlpha})`;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(px - i * 8, playerY - 20 + bobble + Math.sin(g.frame * 0.15 + i) * 2, 6 - i, 0, Math.PI * 2);
        ctx.fill();
      }

      // ============ PARTICLES & FLOATING TEXTS ============
      g.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      g.floatingTexts.forEach(ft => {
        ctx.font = `bold ${16}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // Side glow effects
      const sideGlow = ctx.createLinearGradient(0, 0, 60, 0);
      sideGlow.addColorStop(0, "rgba(88,28,235,0.15)");
      sideGlow.addColorStop(1, "rgba(88,28,235,0)");
      ctx.fillStyle = sideGlow;
      ctx.fillRect(0, g.horizonY, 60, g.groundY - g.horizonY);
      const sideGlow2 = ctx.createLinearGradient(cw, 0, cw - 60, 0);
      sideGlow2.addColorStop(0, "rgba(88,28,235,0.15)");
      sideGlow2.addColorStop(1, "rgba(88,28,235,0)");
      ctx.fillStyle = sideGlow2;
      ctx.fillRect(cw - 60, g.horizonY, 60, g.groundY - g.horizonY);

      setHud(h => ({ ...h, distance: Math.floor(g.distance) }));

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [gameStarted, gameOver, processAnswer]);

  // Activate power-up
  const activatePowerUp = (type: string) => {
    const g = gs.current;
    const info = POWER_UP_INFO[type];
    setActivePowerUp(type);
    setTimeout(() => setActivePowerUp(null), 2000);

    switch (type) {
      case "freeze":
        g.frozenTimer = 300; // 5 seconds
        break;
      case "fifty":
        // Remove one wrong gate
        const wrongGates = g.answerGates.filter(ga => !ga.isCorrect && !ga.passed);
        if (wrongGates.length > 0) wrongGates[0].opacity = 0;
        break;
      case "shield":
        g.hasShield = true;
        break;
      case "doubleXp":
        g.doubleXpCount = 3;
        break;
      case "hint":
        const correctGate = g.answerGates.find(ga => ga.isCorrect);
        if (correctGate) g.hintLane = correctGate.lane;
        break;
    }

    g.floatingTexts.push({
      x: g.canvasW / 2, y: g.groundY - 120,
      text: `${info.icon} ${info.name}!`, color: info.color, life: 2, vy: -1.5,
    });
    toast.success(`${info.icon} ${info.name} activated!`, { duration: 1500 });
  };

  // Spawn power-ups occasionally
  const spawnPowerUp = useCallback(() => {
    const g = gs.current;
    const types = ["freeze", "fifty", "shield", "doubleXp", "hint"];
    const type = types[Math.floor(Math.random() * types.length)];
    g.powerUps.push({ z: 900, lane: Math.floor(Math.random() * 3), type: type as any, passed: false });
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const g = gs.current;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        g.targetLane = Math.max(0, g.targetLane - 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        g.targetLane = Math.min(2, g.targetLane + 1);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameStarted, gameOver]);

  // Touch/swipe controls
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const g = gs.current;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) g.targetLane = Math.max(0, g.targetLane - 1);
        else g.targetLane = Math.min(2, g.targetLane + 1);
      }
      touchStartRef.current = null;
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [gameStarted, gameOver]);

  const startGame = () => {
    const g = gs.current;
    g.playerLane = 1;
    g.targetLane = 1;
    g.playerX = g.canvasW / 2;
    g.speed = config.speed;
    g.distance = 0;
    g.score = 0;
    g.xp = 0;
    g.lives = 3;
    g.streak = 0;
    g.maxStreak = 0;
    g.frame = 0;
    g.trackOffset = 0;
    g.answerGates = [];
    g.powerUps = [];
    g.particles = [];
    g.floatingTexts = [];
    g.currentQuestionIdx = 0;
    g.waitingForAnswer = false;
    g.answered = false;
    g.totalCorrect = 0;
    g.totalAnswered = 0;
    g.hasShield = false;
    g.doubleXpCount = 0;
    g.frozenTimer = 0;
    g.hintLane = -1;
    g.pauseTimer = 0;
    g.topicStats = {};
    g.questionTimerMax = config.questionTime;

    setHud({ score: 0, xp: 0, lives: 3, streak: 0, distance: 0, qNum: 0, qTotal: questions.length, topic: "" });
    setFeedback(null);
    setGameOver(false);
    setGameStarted(true);

    // Start first question after brief delay
    setTimeout(() => {
      nextQuestion();
      // Spawn power-up periodically
      const interval = setInterval(() => {
        if (gs.current.lives <= 0) { clearInterval(interval); return; }
        if (Math.random() < 0.35) spawnPowerUp();
      }, 8000);
      return () => clearInterval(interval);
    }, 1500);
  };

  // ============ RENDER STATES ============

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
          <p className="text-muted-foreground mb-4">Upload study material first to generate quiz questions.</p>
          <Button onClick={onExit}>Back to Game Zone</Button>
        </Card>
      </div>
    );
  }

  // ============ GAME OVER SCREEN ============
  if (gameOver) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <Card className="overflow-hidden border-0 shadow-2xl">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-white/20" style={{
                  width: Math.random() * 6 + 2, height: Math.random() * 6 + 2,
                  left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                }} />
              ))}
            </div>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Trophy className="w-16 h-16 mx-auto text-yellow-300 mb-3" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-1">Run Complete!</h2>
            <p className="text-white/70">Scholar Quest • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode</p>
          </div>

          <div className="p-6 space-y-6 bg-card">
            {/* Main stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Score", value: finalStats.score.toLocaleString(), icon: "🏆", color: "text-yellow-500" },
                { label: "XP Earned", value: `+${finalStats.xp}`, icon: "⚡", color: "text-blue-500" },
                { label: "Accuracy", value: `${finalStats.accuracy}%`, icon: "🎯", color: finalStats.accuracy >= 70 ? "text-green-500" : "text-orange-500" },
                { label: "Best Streak", value: `${finalStats.maxStreak}🔥`, icon: "", color: "text-orange-500" },
                { label: "Answered", value: `${finalStats.totalCorrect}/${finalStats.totalAnswered}`, icon: "📝", color: "text-violet-500" },
                { label: "Distance", value: `${Math.floor(gs.current.distance)}m`, icon: "🏃", color: "text-emerald-500" },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                  <div className="p-3 rounded-xl bg-muted/50 border text-center">
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.icon}{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Topic analysis */}
            {(finalStats.weakTopics.length > 0 || finalStats.strongTopics.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {finalStats.strongTopics.length > 0 && (
                  <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                    <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Strong Topics
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {finalStats.strongTopics.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] bg-green-500/10 text-green-700">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {finalStats.weakTopics.length > 0 && (
                  <div className="p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
                    <p className="text-xs font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Needs Review
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {finalStats.weakTopics.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-700">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button onClick={startGame} size="lg" className="flex-1 gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white">
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
              <Button onClick={onExit} variant="outline" size="lg" className="flex-1">
                Back to Games
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ============ START SCREEN ============
  if (!gameStarted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <motion.div key={i} className="absolute rounded-full bg-white/10"
                  animate={{ y: [-20, -200], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 + Math.random() * 4, delay: Math.random() * 3 }}
                  style={{ width: 4, height: 4, left: `${Math.random() * 100}%`, bottom: 0 }}
                />
              ))}
            </div>
            <div className="text-5xl mb-3">🏃‍♂️</div>
            <h2 className="text-3xl font-bold mb-2">Scholar Quest</h2>
            <p className="text-lg text-white/70">Run & Revise</p>
          </div>

          <div className="p-6 space-y-5 bg-card">
            <p className="text-sm text-muted-foreground text-center">
              Run through the Knowledge City! Answer questions by switching to the correct lane.
              Wrong answers cost lives. How far can you go?
            </p>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="gap-1">📝 {questions.length} Questions</Badge>
              <Badge style={{ backgroundColor: config.color + "22", color: config.color, borderColor: config.color + "44" }}>
                {config.label} Mode
              </Badge>
            </div>

            {/* Controls guide */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <ChevronLeft className="w-6 h-6 mx-auto text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground mt-1">A / ← Left</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-lg">🎯</div>
                <p className="text-[10px] text-muted-foreground mt-1">Pick Correct Lane</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <ChevronRight className="w-6 h-6 mx-auto text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground mt-1">D / → Right</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">📱 On mobile, swipe left/right to switch lanes</p>

            <Button onClick={startGame} size="lg" className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-lg h-12 gap-2">
              <Zap className="w-5 h-5" /> Start Running!
            </Button>
            <Button variant="ghost" onClick={onExit} className="w-full text-muted-foreground">
              Back to Game Zone
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ============ ACTIVE GAME SCREEN ============
  return (
    <div className="max-w-[900px] mx-auto space-y-0" ref={containerRef}>
      {/* Cinematic top bar with score/xp/streak */}
      <div className="relative rounded-t-2xl overflow-hidden bg-gradient-to-r from-[#0f0524] via-[#1a0a3e] to-[#0f0524] border border-b-0 border-purple-500/20 px-3 py-2">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <span className="text-amber-400 text-xs font-bold">🔥</span>
              <span className="text-amber-300 text-xs font-bold">{hud.streak}x</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 text-xs font-bold">{hud.xp} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[...Array(3)].map((_, i) => (
              <Heart key={i} className={`w-5 h-5 transition-all duration-300 ${
                i < hud.lives 
                  ? "text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
                  : "text-gray-700/40"
              }`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <Trophy className="w-3 h-3 text-violet-400" />
              <span className="text-violet-300 text-xs font-bold">{hud.score.toLocaleString()}</span>
            </div>
            <div className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-white/50 text-[10px] font-mono">{hud.distance}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question card - glassmorphism style */}
      <AnimatePresence mode="wait">
        {currentQ && (
          <motion.div key={currentQ.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="relative bg-gradient-to-b from-[#1a0a3e] to-[#120830] border-x border-purple-500/20 px-4 py-3">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        Q{hud.qNum}/{hud.qTotal}
                      </span>
                      {hud.topic && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[10px] font-medium border border-cyan-500/20">
                          {hud.topic}
                        </span>
                      )}
                    </div>
                    <p className="text-sm md:text-base font-semibold text-white/90 leading-relaxed">{currentQ.question_text}</p>
                  </div>
                  {/* Timer circle */}
                  <div className="shrink-0 relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15" fill="none"
                        stroke={questionTimerDisplay <= 3 ? "#ef4444" : questionTimerDisplay <= 7 ? "#eab308" : "#22c55e"}
                        strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray={`${(questionTimerDisplay / config.questionTime) * 94.25} 94.25`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <span className={`absolute text-sm font-bold ${
                      questionTimerDisplay <= 3 ? "text-red-400" : questionTimerDisplay <= 7 ? "text-yellow-400" : "text-green-400"
                    }`}>{questionTimerDisplay}</span>
                  </div>
                </div>
                {/* Answer lane labels */}
                <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                  {gs.current.answerGates.filter(g => g.opacity > 0).map((gate, i) => (
                    <div key={i} className="group relative text-[10px] text-center text-white/60 bg-white/5 rounded-lg px-2 py-1.5 border border-white/10 truncate backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <span className="font-bold text-purple-400 mr-1">{["A", "B", "C"][gate.lane]}</span>
                      <span className="text-white/70">{gate.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas with enhanced border effects */}
      <div className="relative overflow-hidden border-x border-purple-500/20">
        {/* Top edge glow */}
        <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#120830]/80 to-transparent z-10 pointer-events-none" />
        <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: "16/10", display: "block" }} />

        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0a0418] to-transparent pointer-events-none" />

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                feedback.type === "correct" ? "bg-green-500/5" : "bg-red-500/5"
              }`}
            >
              <div className={`px-8 py-4 rounded-2xl backdrop-blur-md text-center shadow-2xl ${
                feedback.type === "correct"
                  ? "bg-green-500/15 border-2 border-green-400/40 shadow-green-500/20"
                  : "bg-red-500/15 border-2 border-red-400/40 shadow-red-500/20"
              }`}>
                <p className={`text-2xl font-extrabold ${feedback.type === "correct" ? "text-green-300" : "text-red-300"}`}>
                  {feedback.type === "correct" ? "✓ Correct!" : "✗ Wrong!"}
                </p>
                <p className="text-sm mt-1.5 text-white/70">{feedback.text}</p>
                {feedback.explanation && (
                  <p className="text-xs mt-1.5 text-white/40 max-w-sm">{feedback.explanation}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Power-up notification */}
        <AnimatePresence>
          {activePowerUp && (
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20"
            >
              <div className="px-4 py-2 rounded-full backdrop-blur-md text-sm font-bold shadow-lg" style={{
                background: `linear-gradient(135deg, ${POWER_UP_INFO[activePowerUp]?.color}22, ${POWER_UP_INFO[activePowerUp]?.color}11)`,
                color: POWER_UP_INFO[activePowerUp]?.color,
                borderWidth: 1,
                borderColor: POWER_UP_INFO[activePowerUp]?.color + "44",
                boxShadow: `0 0 20px ${POWER_UP_INFO[activePowerUp]?.color}33`,
              }}>
                {POWER_UP_INFO[activePowerUp]?.icon} {POWER_UP_INFO[activePowerUp]?.name}!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar with mobile controls */}
      <div className="rounded-b-2xl overflow-hidden bg-gradient-to-b from-[#0a0418] to-[#0f0524] border border-t-0 border-purple-500/20 p-2">
        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 md:hidden mb-2">
          <Button
            variant="ghost"
            className="h-14 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 active:from-purple-500/30 active:to-violet-500/30 transition-all"
            onTouchStart={() => { gs.current.targetLane = Math.max(0, gs.current.targetLane - 1); }}
          >
            <ChevronLeft className="w-7 h-7 text-purple-300" />
          </Button>
          <div className="h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Lane</p>
              <p className="text-lg font-bold text-purple-300">{gs.current.targetLane + 1}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="h-14 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 active:from-purple-500/30 active:to-violet-500/30 transition-all"
            onTouchStart={() => { gs.current.targetLane = Math.min(2, gs.current.targetLane + 1); }}
          >
            <ChevronRight className="w-7 h-7 text-purple-300" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={() => { endGame(); }}
          className="w-full text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest h-7">
          ⏹ Exit Run
        </Button>
      </div>
    </div>
  );
};

export default RunAndRevise;
