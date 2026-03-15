import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { UserGameStats, GameBadge, LEVEL_NAMES, getXpForLevel } from "@/types/gamezone";
import { motion } from "framer-motion";
import { Trophy, Zap, Target, Gamepad2, Upload, Swords, Flame, Star } from "lucide-react";

interface GameDashboardProps {
  userId: string;
  userName: string;
}

const GameDashboard = ({ userId, userName }: GameDashboardProps) => {
  const [stats, setStats] = useState<UserGameStats | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<GameBadge[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("user_game_stats")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) setStats(data as unknown as UserGameStats);
    };

    const fetchBadges = async () => {
      const { data: userBadges } = await supabase
        .from("user_game_badges")
        .select("*, game_badges(*)")
        .eq("user_id", userId);
      if (userBadges) setBadges(userBadges);

      const { data: all } = await supabase.from("game_badges").select("*");
      if (all) setAllBadges(all as unknown as GameBadge[]);
    };

    fetchStats();
    fetchBadges();
  }, [userId]);

  const level = stats?.level || 1;
  const xp = stats?.total_xp || 0;
  const nextLevelXp = getXpForLevel(level);
  const xpProgress = Math.min((xp / nextLevelXp) * 100, 100);
  const accuracy = stats && stats.total_answered > 0
    ? Math.round((stats.total_correct / stats.total_answered) * 100)
    : 0;

  const statCards = [
    { label: "Games Played", value: stats?.games_played || 0, icon: Gamepad2, color: "text-primary" },
    { label: "Accuracy", value: `${accuracy}%`, icon: Target, color: "text-green-500" },
    { label: "Best Streak", value: stats?.longest_streak || 0, icon: Flame, color: "text-orange-500" },
    { label: "Materials", value: stats?.materials_uploaded || 0, icon: Upload, color: "text-blue-500" },
    { label: "Battles Won", value: stats?.battles_won || 0, icon: Swords, color: "text-purple-500" },
    { label: "Total XP", value: xp, icon: Star, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {level}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{LEVEL_NAMES[Math.min(level, 5)] || `Level ${level}`}</h3>
              <p className="text-sm text-muted-foreground">{xp} / {nextLevelXp} XP</p>
              <Progress value={xpProgress} className="mt-2 h-3" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Badges
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {allBadges.map(badge => {
            const earned = badges.some(b => b.badge_id === badge.id);
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                className={`p-3 rounded-xl text-center border-2 transition-colors ${
                  earned ? "border-yellow-500/50 bg-yellow-500/5" : "border-muted opacity-40"
                }`}
              >
                <span className="text-3xl block mb-1">{badge.icon}</span>
                <p className="text-xs font-medium">{badge.name}</p>
                {earned && (
                  <Badge className="mt-1 text-[10px] bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                    Earned
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default GameDashboard;
