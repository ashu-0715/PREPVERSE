-- Create password reset codes table
CREATE TABLE public.password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check codes (needed for verification)
CREATE POLICY "Anyone can verify codes"
  ON public.password_reset_codes
  FOR SELECT
  USING (true);

-- Policy: Allow insert for reset codes
CREATE POLICY "Allow insert codes"
  ON public.password_reset_codes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update codes
CREATE POLICY "Allow update codes"
  ON public.password_reset_codes
  FOR UPDATE
  USING (true);

-- Create user activity tracking table
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all activity (using has_role function)
CREATE POLICY "Admins can view all activity"
  ON public.user_activity
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create user sessions tracking table
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can view all sessions
CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles RLS to allow admin to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update notes RLS to allow admin to view all notes
CREATE POLICY "Admins can view all notes"
  ON public.notes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update user_roles RLS to allow admin to view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));