import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, MessageCircle, Loader2, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SkillConnection, ConnectionStatus } from "@/types/skillswap";

interface ConnectionsTabProps {
  userId: string;
}

export function ConnectionsTab({ userId }: ConnectionsTabProps) {
  const [connections, setConnections] = useState<SkillConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, [userId]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("skill_connections")
        .select(`
          *,
          post:skill_posts_v2(skill_title, category, post_type)
        `)
        .or(`requester_id.eq.${userId},post_owner_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch requester and post owner profiles
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          const [requesterRes, ownerRes] = await Promise.all([
            supabase.from("profiles").select("full_name, avatar_url").eq("id", conn.requester_id).single(),
            supabase.from("profiles").select("full_name, avatar_url").eq("id", conn.post_owner_id).single(),
          ]);

          return {
            ...conn,
            requester: requesterRes.data,
            post_owner: ownerRes.data,
          };
        })
      );

      setConnections(connectionsWithProfiles as SkillConnection[]);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: ConnectionStatus) => {
    try {
      const { error } = await supabase
        .from("skill_connections")
        .update({ status })
        .eq("id", connectionId);

      if (error) throw error;

      toast.success(`Connection ${status}`);
      fetchConnections();
    } catch (error) {
      console.error("Error updating connection:", error);
      toast.error("Failed to update connection");
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-700"><X className="w-3 h-3 mr-1" />Declined</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700"><Check className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const incomingConnections = connections.filter((c) => c.post_owner_id === userId);
  const outgoingConnections = connections.filter((c) => c.requester_id === userId);

  const ConnectionCard = ({ connection, isIncoming }: { connection: SkillConnection; isIncoming: boolean }) => {
    const partnerProfile = isIncoming ? connection.requester : connection.post_owner;
    const initials = partnerProfile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={partnerProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="font-semibold">{partnerProfile?.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isIncoming ? "wants to connect" : "you requested"} for "{(connection.post as any)?.skill_title}"
                  </p>
                </div>
                {getStatusBadge(connection.status)}
              </div>

              {connection.message && (
                <div className="p-2 bg-muted/50 rounded-lg my-2">
                  <p className="text-sm">{connection.message}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                </span>

                {isIncoming && connection.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => updateConnectionStatus(connection.id, "accepted")}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => updateConnectionStatus(connection.id, "declined")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}

                {connection.status === "accepted" && (
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
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
    <Tabs defaultValue="incoming">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="incoming">
          Incoming ({incomingConnections.length})
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          Outgoing ({outgoingConnections.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="mt-4 space-y-4">
        {incomingConnections.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">No incoming requests</h3>
            <p className="text-sm text-muted-foreground">
              When someone wants to connect with you, it will show up here.
            </p>
          </Card>
        ) : (
          incomingConnections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} isIncoming={true} />
          ))
        )}
      </TabsContent>

      <TabsContent value="outgoing" className="mt-4 space-y-4">
        {outgoingConnections.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-1">No outgoing requests</h3>
            <p className="text-sm text-muted-foreground">
              Connect with other students by clicking on their posts!
            </p>
          </Card>
        ) : (
          outgoingConnections.map((conn) => (
            <ConnectionCard key={conn.id} connection={conn} isIncoming={false} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
