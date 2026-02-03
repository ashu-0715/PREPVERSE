-- Create chat messages table for SkillSwap
CREATE TABLE public.skill_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.skill_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.skill_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their connections
CREATE POLICY "Users can view messages in their connections"
ON public.skill_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.skill_connections sc
    WHERE sc.id = connection_id
    AND (sc.requester_id = auth.uid() OR sc.post_owner_id = auth.uid())
  )
);

-- Users can send messages to their connections
CREATE POLICY "Users can send messages in their connections"
ON public.skill_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.skill_connections sc
    WHERE sc.id = connection_id
    AND (sc.requester_id = auth.uid() OR sc.post_owner_id = auth.uid())
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can update read status"
ON public.skill_chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.skill_connections sc
    WHERE sc.id = connection_id
    AND (sc.requester_id = auth.uid() OR sc.post_owner_id = auth.uid())
  )
);

-- Create index for faster queries
CREATE INDEX idx_skill_chat_messages_connection ON public.skill_chat_messages(connection_id);
CREATE INDEX idx_skill_chat_messages_created ON public.skill_chat_messages(created_at);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_chat_messages;