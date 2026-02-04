-- Fix: Remove overly permissive "Anyone can view all profiles" policy
-- This exposes student email addresses to the public internet

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view all profiles" ON public.profiles;

-- Create a more restrictive policy for authenticated users only
-- Authenticated users can view basic profile info of other users (for skill swap connections)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Note: The existing policies for admins, faculty, and own profile remain in place:
-- - "Users can view their own profile" (auth.uid() = id)
-- - "Admins can view all profiles" 
-- - "Faculty can view all profiles"