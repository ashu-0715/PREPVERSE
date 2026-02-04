import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UnreadCount {
  connectionId: string;
  count: number;
}

export function useUnreadMessages(userId: string | null) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;

    fetchUnreadCounts();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'skill_chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id !== userId) {
            // Update count for this connection
            setUnreadCounts((prev) => {
              const existing = prev.find((c) => c.connectionId === newMsg.connection_id);
              if (existing) {
                return prev.map((c) =>
                  c.connectionId === newMsg.connection_id
                    ? { ...c, count: c.count + 1 }
                    : c
                );
              }
              return [...prev, { connectionId: newMsg.connection_id, count: 1 }];
            });
            setTotalUnread((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'skill_chat_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          // If message was marked as read, refetch counts
          if (updatedMsg.is_read) {
            fetchUnreadCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchUnreadCounts = async () => {
    if (!userId) return;

    try {
      // Get all connections for this user
      const { data: connections } = await supabase
        .from("skill_connections")
        .select("id")
        .or(`requester_id.eq.${userId},post_owner_id.eq.${userId}`)
        .eq("status", "accepted");

      if (!connections || connections.length === 0) {
        setUnreadCounts([]);
        setTotalUnread(0);
        return;
      }

      // Get unread counts for each connection
      const counts: UnreadCount[] = [];
      let total = 0;

      for (const conn of connections) {
        const { count } = await supabase
          .from("skill_chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("connection_id", conn.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        if (count && count > 0) {
          counts.push({ connectionId: conn.id, count });
          total += count;
        }
      }

      setUnreadCounts(counts);
      setTotalUnread(total);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const getUnreadCount = (connectionId: string) => {
    return unreadCounts.find((c) => c.connectionId === connectionId)?.count || 0;
  };

  const markAsRead = (connectionId: string) => {
    const count = getUnreadCount(connectionId);
    setUnreadCounts((prev) => prev.filter((c) => c.connectionId !== connectionId));
    setTotalUnread((prev) => Math.max(0, prev - count));
  };

  return { unreadCounts, totalUnread, getUnreadCount, markAsRead, refetch: fetchUnreadCounts };
}
