CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'students', (SELECT count(*) FROM public.profiles),
    'notes', (SELECT count(*) FROM public.notes),
    'games', (SELECT COALESCE(SUM(games_played), 0) FROM public.user_game_stats),
    'skills', (SELECT count(*) FROM public.skill_connections)
  )
$$;