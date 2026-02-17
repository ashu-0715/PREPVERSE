
-- Drop the trigger and function that blocks rating updates
DROP TRIGGER IF EXISTS check_note_update ON public.notes;
DROP FUNCTION IF EXISTS public.prevent_rating_update() CASCADE;

-- Fix note_reviews RLS policies - recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.note_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.note_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.note_reviews;

CREATE POLICY "Anyone can view reviews" ON public.note_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.note_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.note_reviews FOR UPDATE USING (auth.uid() = user_id);
