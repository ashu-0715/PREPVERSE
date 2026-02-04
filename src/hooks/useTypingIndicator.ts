import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseTypingIndicatorProps {
  connectionId: string;
  currentUserId: string;
}

export function useTypingIndicator({ connectionId, currentUserId }: UseTypingIndicatorProps) {
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Subscribe to partner's typing status
  useEffect(() => {
    const channel = supabase
      .channel(`typing-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skill_chat_typing',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const record = payload.new as any;
          if (record && record.user_id !== currentUserId) {
            setPartnerIsTyping(record.is_typing);
          }
        }
      )
      .subscribe();

    // Fetch initial typing status
    fetchTypingStatus();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, currentUserId]);

  const fetchTypingStatus = async () => {
    const { data } = await supabase
      .from("skill_chat_typing")
      .select("*")
      .eq("connection_id", connectionId)
      .neq("user_id", currentUserId)
      .single();

    if (data) {
      setPartnerIsTyping(data.is_typing);
    }
  };

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (isTypingRef.current === isTyping) return;
    isTypingRef.current = isTyping;

    try {
      // Upsert typing status
      await supabase
        .from("skill_chat_typing")
        .upsert(
          {
            connection_id: connectionId,
            user_id: currentUserId,
            is_typing: isTyping,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'connection_id,user_id' }
        );
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, [connectionId, currentUserId]);

  const handleTyping = useCallback(() => {
    setTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Set typing to false when leaving
      setTyping(false);
    };
  }, [setTyping]);

  return { partnerIsTyping, handleTyping };
}
