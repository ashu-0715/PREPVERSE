import { motion } from "framer-motion";

type ModuleTheme = "career" | "notes" | "skillswap" | "gamezone" | "exam" | "tracker";

const themeConfig: Record<ModuleTheme, {
  colors: string[];
  shapes: string[];
  gradientFrom: string;
  gradientTo: string;
}> = {
  career: {
    colors: ["rgba(168,85,247,0.15)", "rgba(236,72,153,0.12)", "rgba(139,92,246,0.1)"],
    shapes: ["🧭", "🎯", "🗺️", "💼", "🚀"],
    gradientFrom: "from-purple-500/5",
    gradientTo: "to-pink-500/5",
  },
  tracker: {
    colors: ["rgba(59,130,246,0.15)", "rgba(6,182,212,0.12)", "rgba(99,102,241,0.1)"],
    shapes: ["📊", "📈", "⚡", "🔥", "💡"],
    gradientFrom: "from-blue-500/5",
    gradientTo: "to-cyan-500/5",
  },
  notes: {
    colors: ["rgba(34,197,94,0.15)", "rgba(16,185,129,0.12)", "rgba(52,211,153,0.1)"],
    shapes: ["📝", "📄", "📚", "✏️", "🎓"],
    gradientFrom: "from-green-500/5",
    gradientTo: "to-emerald-500/5",
  },
  skillswap: {
    colors: ["rgba(249,115,22,0.15)", "rgba(239,68,68,0.12)", "rgba(251,146,60,0.1)"],
    shapes: ["🤝", "💬", "💡", "🌟", "🎤"],
    gradientFrom: "from-orange-500/5",
    gradientTo: "to-red-500/5",
  },
  exam: {
    colors: ["rgba(99,102,241,0.15)", "rgba(168,85,247,0.12)", "rgba(129,140,248,0.1)"],
    shapes: ["📖", "✅", "⏱️", "🏆", "🎯"],
    gradientFrom: "from-indigo-500/5",
    gradientTo: "to-purple-500/5",
  },
  gamezone: {
    colors: ["rgba(236,72,153,0.15)", "rgba(244,63,94,0.12)", "rgba(251,113,133,0.1)"],
    shapes: ["🎮", "⚔️", "🏅", "🎲", "⭐"],
    gradientFrom: "from-pink-500/5",
    gradientTo: "to-rose-500/5",
  },
};

const FloatingShape = ({
  emoji,
  delay,
  duration,
  x,
  y,
  size,
}: {
  emoji: string;
  delay: number;
  duration: number;
  x: number;
  y: number;
  size: number;
}) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ left: `${x}%`, top: `${y}%`, fontSize: size }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 0.3, 0.15, 0.3, 0],
      scale: [0.5, 1, 0.8, 1, 0.5],
      y: [0, -30, -10, -40, 0],
      x: [0, 10, -10, 5, 0],
      rotate: [0, 10, -10, 5, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {emoji}
  </motion.div>
);

const GlowOrb = ({
  color,
  x,
  y,
  size,
  delay,
}: {
  color: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none blur-3xl"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      background: color,
    }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.4, 0.7, 0.4],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

interface ModuleBackgroundProps {
  theme: ModuleTheme;
}

const ModuleBackground = ({ theme }: ModuleBackgroundProps) => {
  const config = themeConfig[theme];

  const shapePositions = [
    { x: 8, y: 15, size: 24, delay: 0, duration: 12 },
    { x: 85, y: 10, size: 20, delay: 2, duration: 14 },
    { x: 15, y: 70, size: 22, delay: 4, duration: 10 },
    { x: 75, y: 65, size: 18, delay: 1, duration: 13 },
    { x: 50, y: 40, size: 26, delay: 3, duration: 11 },
    { x: 92, y: 45, size: 16, delay: 5, duration: 15 },
    { x: 30, y: 85, size: 20, delay: 2.5, duration: 12 },
    { x: 65, y: 25, size: 22, delay: 1.5, duration: 14 },
  ];

  const orbPositions = [
    { x: 10, y: 20, size: 200, delay: 0 },
    { x: 70, y: 10, size: 250, delay: 2 },
    { x: 40, y: 60, size: 180, delay: 4 },
    { x: 80, y: 70, size: 220, delay: 1 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`} />

      {/* Animated grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      {orbPositions.map((orb, i) => (
        <GlowOrb
          key={`orb-${i}`}
          color={config.colors[i % config.colors.length]}
          x={orb.x}
          y={orb.y}
          size={orb.size}
          delay={orb.delay}
        />
      ))}

      {/* Floating emoji shapes */}
      {shapePositions.map((pos, i) => (
        <FloatingShape
          key={`shape-${i}`}
          emoji={config.shapes[i % config.shapes.length]}
          x={pos.x}
          y={pos.y}
          size={pos.size}
          delay={pos.delay}
          duration={pos.duration}
        />
      ))}
    </div>
  );
};

export default ModuleBackground;
