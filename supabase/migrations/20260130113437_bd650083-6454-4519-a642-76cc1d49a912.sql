-- Allow faculty to view all student profiles
CREATE POLICY "Faculty can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'faculty') OR has_role(auth.uid(), 'admin'));

-- Allow faculty to view all notes
CREATE POLICY "Faculty can view all notes"
ON public.notes
FOR SELECT
USING (has_role(auth.uid(), 'faculty'));

-- Allow faculty to view student activity
CREATE POLICY "Faculty can view student activity"
ON public.user_activity
FOR SELECT
USING (has_role(auth.uid(), 'faculty'));

-- Allow faculty to view user roles (to identify students)
CREATE POLICY "Faculty can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'faculty'));

-- Allow faculty to view user sessions
CREATE POLICY "Faculty can view all sessions"
ON public.user_sessions
FOR SELECT
USING (has_role(auth.uid(), 'faculty'));