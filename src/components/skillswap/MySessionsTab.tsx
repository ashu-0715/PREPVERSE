import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, ExternalLink, Star, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { SkillSession, PLATFORM_OPTIONS, SessionStatus } from "@/types/skillswap";
import { ReviewDialog } from "./ReviewDialog";

interface MySessionsTabProps {
  userId: string;
}

export function MySessionsTab({ userId }: MySessionsTabProps) {
  const [sessions, setSessions] = useState<SkillSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewSession, setReviewSession] = useState<SkillSession | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("skill_sessions")
        .select(`
          *,
          connection:skill_connections(
            *,
            post:skill_posts_v2(skill_title, category)
          )
        `)
        .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;

      // Fetch teacher and learner profiles
      const sessionsWithProfiles = await Promise.all(
        (data || []).map(async (session) => {
          const [teacherRes, learnerRes] = await Promise.all([
            supabase.from("profiles").select("full_name, avatar_url").eq("id", session.teacher_id).single(),
            supabase.from("profiles").select("full_name, avatar_url").eq("id", session.learner_id).single(),
          ]);

          return {
            ...session,
            teacher: teacherRes.data,
            learner: learnerRes.data,
          };
        })
      );

      setSessions(sessionsWithProfiles as SkillSession[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: SessionStatus) => {
    try {
      const { error } = await supabase
        .from("skill_sessions")
        .update({ status })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success(`Session ${status}`);
      fetchSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const upcomingSessions = sessions.filter((s) => s.status === "scheduled" || s.status === "in_progress");
  const pastSessions = sessions.filter((s) => s.status === "completed" || s.status === "cancelled");

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const SessionCard = ({ session }: { session: SkillSession }) => {
    const platform = PLATFORM_OPTIONS.find((p) => p.value === session.meeting_platform);
    const isTeacher = session.teacher_id === userId;
    const partnerProfile = isTeacher ? session.learner : session.teacher;
    const partnerRole = isTeacher ? "Learner" : "Teacher";

    const initials = partnerProfile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={partnerProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{(session.connection as any)?.post?.skill_title || "Session"}</h4>
                  <p className="text-sm text-muted-foreground">
                    {partnerRole}: {partnerProfile?.full_name}
                  </p>
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(session.scheduled_date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.scheduled_time} ({session.duration} min)
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {platform?.label}
                </span>
              </div>

              {/* Actions based on status */}
              <div className="flex flex-wrap gap-2">
                {session.status === "scheduled" && session.meeting_link && (
                  <Button size="sm" asChild>
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Join Meeting
                    </a>
                  </Button>
                )}

                {session.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => updateSessionStatus(session.id, "completed")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => updateSessionStatus(session.id, "cancelled")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}

                {session.status === "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReviewSession(session)}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Leave Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No upcoming sessions</h3>
              <p className="text-sm text-muted-foreground">
                Schedule a session by connecting with other students!
              </p>
            </Card>
          ) : (
            upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {pastSessions.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No past sessions</h3>
              <p className="text-sm text-muted-foreground">
                Complete your first session to see it here!
              </p>
            </Card>
          ) : (
            pastSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {reviewSession && (
        <ReviewDialog
          open={!!reviewSession}
          onOpenChange={(open) => !open && setReviewSession(null)}
          session={reviewSession}
          currentUserId={userId}
          onSuccess={() => {
            setReviewSession(null);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
