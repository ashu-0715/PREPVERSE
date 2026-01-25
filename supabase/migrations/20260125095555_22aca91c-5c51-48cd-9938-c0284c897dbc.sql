-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true);

-- Storage policies for notes bucket
CREATE POLICY "Anyone can view notes files"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Authenticated users can upload notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes');

CREATE POLICY "Users can delete their own notes files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create note_requests table
CREATE TABLE public.note_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    subject text NOT NULL,
    topic text NOT NULL,
    semester text,
    description text,
    is_fulfilled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.note_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_requests
CREATE POLICY "Anyone can view note requests"
ON public.note_requests FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create requests"
ON public.note_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
ON public.note_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
ON public.note_requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add UPDATE and DELETE policies for notes table
CREATE POLICY "Users can update their own notes"
ON public.notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);