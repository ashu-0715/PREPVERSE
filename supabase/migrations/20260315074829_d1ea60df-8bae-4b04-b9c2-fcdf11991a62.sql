
-- Game question sets
CREATE TABLE public.game_question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  source_file_name text,
  source_file_url text,
  total_questions integer DEFAULT 0,
  difficulty text DEFAULT 'medium',
  topics text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.game_question_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own question sets" ON public.game_question_sets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create question sets" ON public.game_question_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own question sets" ON public.game_question_sets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own question sets" ON public.game_question_sets FOR DELETE USING (auth.uid() = user_id);

-- Questions
CREATE TABLE public.game_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id uuid NOT NULL REFERENCES public.game_question_sets(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'mcq',
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer text NOT NULL,
  explanation text,
  difficulty text DEFAULT 'medium',
  topic text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view questions" ON public.game_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.game_question_sets WHERE id = game_questions.question_set_id AND user_id = auth.uid())
);
CREATE POLICY "Owners can insert questions" ON public.game_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_question_sets WHERE id = game_questions.question_set_id AND user_id = auth.uid())
);

-- Game rooms
CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  room_code text NOT NULL UNIQUE,
  question_set_id uuid NOT NULL REFERENCES public.game_question_sets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting',
  max_players integer DEFAULT 10,
  current_question_index integer DEFAULT 0,
  question_timer integer DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view rooms" ON public.game_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can create rooms" ON public.game_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.game_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Host can delete room" ON public.game_rooms FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Players
CREATE TABLE public.game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  score integer DEFAULT 0,
  streak integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  total_answered integer DEFAULT 0,
  is_ready boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view players" ON public.game_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join" ON public.game_players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update self" ON public.game_players FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.game_players FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Room participants can view questions
CREATE POLICY "Participants can view questions" ON public.game_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_rooms gr
    JOIN public.game_players gp ON gp.room_id = gr.id
    WHERE gr.question_set_id = game_questions.question_set_id
    AND gp.user_id = auth.uid()
  )
);

-- Answers
CREATE TABLE public.game_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.game_questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  is_correct boolean NOT NULL,
  time_taken_ms integer,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view answers" ON public.game_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can submit" ON public.game_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_players WHERE id = game_answers.player_id AND user_id = auth.uid())
);

-- User game stats
CREATE TABLE public.user_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_xp integer DEFAULT 0,
  level integer DEFAULT 1,
  games_played integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_answered integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  battles_won integer DEFAULT 0,
  materials_uploaded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_game_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view stats" ON public.user_game_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create stats" ON public.user_game_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update stats" ON public.user_game_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Game badges
CREATE TABLE public.game_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  criteria jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.game_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game badges" ON public.game_badges FOR SELECT USING (true);

-- User game badges
CREATE TABLE public.user_game_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.game_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_game_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can view user badges" ON public.user_game_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can earn badges" ON public.user_game_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_answers;

-- Shared question sets for room participants
CREATE POLICY "Room participants can view sets" ON public.game_question_sets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_rooms gr
    JOIN public.game_players gp ON gp.room_id = gr.id
    WHERE gr.question_set_id = game_question_sets.id
    AND gp.user_id = auth.uid()
  )
);

-- Default badges
INSERT INTO public.game_badges (name, description, icon, criteria) VALUES
  ('First Upload', 'Uploaded your first study material', '📤', '{"type": "upload", "count": 1}'),
  ('Revision Rookie', 'Played your first game', '🎮', '{"type": "games_played", "count": 1}'),
  ('Quiz Runner', 'Completed 10 quiz battles', '🏃', '{"type": "games_played", "count": 10}'),
  ('Accuracy Master', 'Achieved 90% accuracy in a game', '🎯', '{"type": "accuracy", "threshold": 90}'),
  ('Battle Winner', 'Won a quiz battle', '🏆', '{"type": "battles_won", "count": 1}'),
  ('Speed Demon', 'Answered 10 questions under 5s each', '⚡', '{"type": "speed", "count": 10}'),
  ('Social Learner', 'Played 5 games with friends', '👥', '{"type": "multiplayer", "count": 5}');
