CREATE TABLE public.gate_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_slug text NOT NULL,
  topic text,
  front text NOT NULL,
  back text NOT NULL,
  interval_days integer NOT NULL DEFAULT 0,
  reviews integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gate_flashcards TO authenticated;
GRANT ALL ON public.gate_flashcards TO service_role;
ALTER TABLE public.gate_flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own flashcards" ON public.gate_flashcards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.gate_study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hours_per_day numeric NOT NULL DEFAULT 3,
  plan jsonb NOT NULL,
  completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gate_study_plans TO authenticated;
GRANT ALL ON public.gate_study_plans TO service_role;
ALTER TABLE public.gate_study_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own plans" ON public.gate_study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.gate_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_slug text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  time_taken_s integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.gate_quiz_attempts TO authenticated;
GRANT ALL ON public.gate_quiz_attempts TO service_role;
ALTER TABLE public.gate_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.gate_quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);