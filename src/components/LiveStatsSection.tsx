import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Gamepad2, TrendingUp } from "lucide-react";
import { motion, useInView } from "framer-motion";

interface StatItem {
  label: string;
  value: number;
  icon: React.ElementType;
  suffix?: string;
}

const AnimatedCounter = ({ target, duration = 2000 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

const LiveStatsSection = () => {
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Students Learning", value: 0, icon: Users, suffix: "+" },
    { label: "Notes Shared", value: 0, icon: FileText, suffix: "+" },
    { label: "Games Played", value: 0, icon: Gamepad2, suffix: "+" },
    { label: "Skills Exchanged", value: 0, icon: TrendingUp, suffix: "+" },
  ]);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const [profilesRes, notesRes, gamesRes, skillsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("notes").select("id", { count: "exact", head: true }),
      supabase.from("user_game_stats").select("games_played"),
      supabase.from("skill_connections").select("id", { count: "exact", head: true }),
    ]);

    const totalGames = (gamesRes.data || []).reduce((sum, s) => sum + (s.games_played || 0), 0);

    setStats([
      { label: "Students Learning", value: profilesRes.count || 0, icon: Users, suffix: "+" },
      { label: "Notes Shared", value: notesRes.count || 0, icon: FileText, suffix: "+" },
      { label: "Games Played", value: totalGames, icon: Gamepad2, suffix: "+" },
      { label: "Skills Exchanged", value: skillsRes.count || 0, icon: TrendingUp, suffix: "+" },
    ]);
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join the Growing{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Community</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Students already learning smarter with PrepVerse
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500" />
                <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 md:p-8 text-center hover:border-primary/30 transition-all duration-300">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <stat.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    <AnimatedCounter target={stat.value} />
                    {stat.suffix}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStatsSection;
