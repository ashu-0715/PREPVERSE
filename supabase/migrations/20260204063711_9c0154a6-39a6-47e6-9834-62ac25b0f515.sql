-- Create typing status table for realtime typing indicators
CREATE TABLE public.skill_chat_typing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.skill_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for one typing status per user per connection
ALTER TABLE public.skill_chat_typing
ADD CONSTRAINT unique_typing_per_user_connection UNIQUE (connection_id, user_id);

-- Enable RLS
ALTER TABLE public.skill_chat_typing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view typing status in their connections"
ON public.skill_chat_typing
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM skill_connections sc
    WHERE sc.id = skill_chat_typing.connection_id
    AND (sc.requester_id = auth.uid() OR sc.post_owner_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own typing status"
ON public.skill_chat_typing
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM skill_connections sc
    WHERE sc.id = skill_chat_typing.connection_id
    AND (sc.requester_id = auth.uid() OR sc.post_owner_id = auth.uid())
  )
);

CREATE POLICY "Users can modify their own typing status"
ON public.skill_chat_typing
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
ON public.skill_chat_typing
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for fast lookups
CREATE INDEX idx_typing_connection ON public.skill_chat_typing(connection_id);

-- Enable realtime for typing status
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_chat_typing;