-- =====================================================
-- SECURITY FIX 1: Remove public access to password_reset_codes table
-- Prevents hackers from reading reset codes directly
-- =====================================================

-- Drop the vulnerable public SELECT policy
DROP POLICY IF EXISTS "Anyone can verify codes" ON public.password_reset_codes;

-- Drop the vulnerable INSERT policy that allows anyone to insert
DROP POLICY IF EXISTS "Allow insert codes" ON public.password_reset_codes;

-- Drop the vulnerable UPDATE policy
DROP POLICY IF EXISTS "Allow update codes" ON public.password_reset_codes;

-- Now the table has NO public access - only service role key can access it
-- Edge functions use service role key, so they can still read/write

-- =====================================================
-- SECURITY FIX 2: Prevent users from self-assigning roles
-- Remove the INSERT policy and create a trigger instead
-- =====================================================

-- Drop the vulnerable INSERT policy
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- Create a function to automatically assign the student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Always assign student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Add a unique constraint on user_id to prevent duplicate roles
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Add policy for admins to update roles (promote users)
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));