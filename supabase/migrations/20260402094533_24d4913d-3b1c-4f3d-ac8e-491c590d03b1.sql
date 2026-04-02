
DROP POLICY IF EXISTS "Authenticated users can add subjects" ON public.subjects;
CREATE POLICY "Authenticated users can add subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
