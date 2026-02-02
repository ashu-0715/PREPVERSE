import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { UserSkillBadge, SkillBadge } from "@/types/skillswap";

interface BadgesSectionProps {
  userId: string;
}

export function BadgesSection({ userId }: BadgesSectionProps) {
  const [userBadges, setUserBadges] = useState<UserSkillBadge[]>([]);
  const [allBadges, setAllBadges] = useState<SkillBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      const [userBadgesRes, allBadgesRes] = await Promise.all([
        supabase
          .from("user_skill_badges")
          .select(`
            *,
            badge:skill_badges(*)
          `)
          .eq("user_id", userId),
        supabase.from("skill_badges").select("*"),
      ]);

      if (userBadgesRes.error) throw userBadgesRes.error;
      if (allBadgesRes.error) throw allBadgesRes.error;

      setUserBadges(userBadgesRes.data as UserSkillBadge[]);
      setAllBadges(allBadgesRes.data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Your Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <TooltipProvider>
            {allBadges.map((badge) => {
              const earned = userBadges.find((ub) => ub.badge_id === badge.id);
              const isEarned = earnedBadgeIds.includes(badge.id);

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                        isEarned
                          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800"
                          : "bg-muted/50 opacity-50 grayscale"
                      }`}
                    >
                      <span className="text-3xl mb-2">{badge.icon}</span>
                      <span className={`text-sm font-medium text-center ${!isEarned && "text-muted-foreground"}`}>
                        {badge.name}
                      </span>
                      {isEarned && earned && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {format(new Date(earned.earned_at), "MMM d, yyyy")}
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-xs mt-1 text-yellow-600">Keep going to earn this badge!</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {userBadges.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">
            Complete sessions and get great reviews to earn badges!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
