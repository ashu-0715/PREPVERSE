import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseSkillSwapNotificationsProps {
  userId: string | null;
  enabled?: boolean;
}

export function useSkillSwapNotifications({ userId, enabled = true }: UseSkillSwapNotificationsProps) {
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const processedConnectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !enabled) return;

    // Subscribe to new chat messages
    const messagesChannel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'skill_chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Skip if from current user or already processed
          if (newMsg.sender_id === userId || processedMessagesRef.current.has(newMsg.id)) {
            return;
          }
          
          processedMessagesRef.current.add(newMsg.id);

          // Check if this message is in a connection we're part of
          const { data: connection } = await supabase
            .from("skill_connections")
            .select("id, requester_id, post_owner_id")
            .eq("id", newMsg.connection_id)
            .single();

          if (!connection) return;
          
          const isParticipant = connection.requester_id === userId || connection.post_owner_id === userId;
          if (!isParticipant) return;

          // Get sender name
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMsg.sender_id)
            .single();

          toast.info(`💬 New message from ${sender?.full_name || 'Someone'}`, {
            description: newMsg.message.substring(0, 50) + (newMsg.message.length > 50 ? '...' : ''),
            duration: 5000,
          });
        }
      )
      .subscribe();

    // Subscribe to new connection requests
    const connectionsChannel = supabase
      .channel('connection-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'skill_connections',
        },
        async (payload) => {
          const newConn = payload.new as any;
          
          // Only notify post owner about new requests
          if (newConn.post_owner_id !== userId || processedConnectionsRef.current.has(newConn.id)) {
            return;
          }
          
          processedConnectionsRef.current.add(newConn.id);

          // Get requester name and post title
          const [requesterRes, postRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", newConn.requester_id).single(),
            supabase.from("skill_posts_v2").select("skill_title").eq("id", newConn.post_id).single(),
          ]);

          toast.info(`🤝 New connection request!`, {
            description: `${requesterRes.data?.full_name || 'Someone'} wants to connect for "${postRes.data?.skill_title || 'your post'}"`,
            duration: 6000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'skill_connections',
        },
        async (payload) => {
          const conn = payload.new as any;
          const oldConn = payload.old as any;
          
          // Notify requester when their request is accepted
          if (conn.requester_id === userId && conn.status === 'accepted' && oldConn.status === 'pending') {
            const { data: owner } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", conn.post_owner_id)
              .single();

            toast.success(`🎉 Connection accepted!`, {
              description: `${owner?.full_name || 'Someone'} accepted your connection request. You can now chat!`,
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [userId, enabled]);
}
