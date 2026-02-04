-- Fix: Set search_path on update_updated_at_column function to prevent mutable search path vulnerability
-- This function was detected without a fixed search_path, which could be exploited if the search_path is modified

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;