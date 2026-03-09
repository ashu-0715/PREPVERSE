-- Allow admins to delete any note
CREATE POLICY "Admins can delete any note" ON public.notes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update payments (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user_activity
CREATE POLICY "Admins can delete activity" ON public.user_activity FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user_sessions
CREATE POLICY "Admins can delete sessions" ON public.user_sessions FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user_roles
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete note_reviews
CREATE POLICY "Admins can delete reviews" ON public.note_reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete note_purchases
CREATE POLICY "Admins can delete purchases" ON public.note_purchases FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add trigger back for updating note ratings
CREATE OR REPLACE TRIGGER update_note_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.note_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_note_rating();