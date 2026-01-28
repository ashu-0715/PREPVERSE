-- =====================================================
-- SECURITY FIX 1: Prevent direct rating manipulation on notes table
-- Users can only update title, subject, semester - not rating fields
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_rating_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.rating IS DISTINCT FROM NEW.rating OR OLD.rating_count IS DISTINCT FROM NEW.rating_count THEN
    RAISE EXCEPTION 'Cannot directly update rating fields';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_note_update ON public.notes;
CREATE TRIGGER check_note_update
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_rating_update();

-- =====================================================
-- SECURITY FIX 2: Restrict has_role function to only check calling user's role
-- Prevents users from checking other users' roles
-- =====================================================

-- First, create a new version that only checks the calling user's role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Keep the old function signature for backward compatibility with existing RLS policies
-- but restrict it to only work when checking the calling user's own role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _user_id = auth.uid() THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
    ELSE false
  END
$$;

-- Restrict get_user_role to only return the calling user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _user_id = auth.uid() THEN (
      SELECT role
      FROM public.user_roles
      WHERE user_id = _user_id
      LIMIT 1
    )
    ELSE NULL
  END
$$;