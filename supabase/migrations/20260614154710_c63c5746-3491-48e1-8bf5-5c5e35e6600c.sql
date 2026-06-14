
-- Subjects
CREATE TABLE public.gate_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  icon text,
  color text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gate_subjects TO authenticated;
GRANT ALL ON public.gate_subjects TO service_role;
ALTER TABLE public.gate_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects readable by authenticated" ON public.gate_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage subjects" ON public.gate_subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Topics
CREATE TABLE public.gate_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.gate_subjects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subject_id, slug)
);
GRANT SELECT ON public.gate_topics TO authenticated;
GRANT ALL ON public.gate_topics TO service_role;
ALTER TABLE public.gate_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Topics readable by authenticated" ON public.gate_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage topics" ON public.gate_topics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- User progress
CREATE TABLE public.gate_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.gate_topics(id) ON DELETE CASCADE,
  mastery int NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  attempts int NOT NULL DEFAULT 0,
  last_revised_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gate_user_progress TO authenticated;
GRANT ALL ON public.gate_user_progress TO service_role;
ALTER TABLE public.gate_user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.gate_user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_gate_user_progress_updated BEFORE UPDATE ON public.gate_user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI chats
CREATE TABLE public.gate_ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gate_ai_chats TO authenticated;
GRANT ALL ON public.gate_ai_chats TO service_role;
ALTER TABLE public.gate_ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chats" ON public.gate_ai_chats FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_gate_ai_chats_updated BEFORE UPDATE ON public.gate_ai_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI messages
CREATE TABLE public.gate_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.gate_ai_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gate_ai_messages TO authenticated;
GRANT ALL ON public.gate_ai_messages TO service_role;
ALTER TABLE public.gate_ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.gate_ai_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_gate_ai_messages_chat ON public.gate_ai_messages(chat_id, created_at);

-- Seed GATE CSE subjects
INSERT INTO public.gate_subjects (slug, name, weight, icon, color, sort_order) VALUES
  ('aptitude','General Aptitude',15,'Brain','from-pink-500 to-rose-500',1),
  ('engineering-math','Engineering Mathematics',13,'Sigma','from-purple-500 to-fuchsia-500',2),
  ('discrete-math','Discrete Mathematics',8,'GitBranch','from-violet-500 to-purple-500',3),
  ('digital-logic','Digital Logic',7,'Cpu','from-blue-500 to-indigo-500',4),
  ('coa','Computer Organization & Architecture',9,'HardDrive','from-cyan-500 to-blue-500',5),
  ('c-programming','Programming & DSA',15,'Code2','from-emerald-500 to-teal-500',6),
  ('algorithms','Algorithms',8,'Workflow','from-green-500 to-emerald-500',7),
  ('toc','Theory of Computation',8,'Binary','from-yellow-500 to-amber-500',8),
  ('compilers','Compiler Design',5,'Layers','from-orange-500 to-red-500',9),
  ('os','Operating Systems',10,'MonitorCog','from-red-500 to-rose-500',10),
  ('dbms','Databases',8,'Database','from-sky-500 to-cyan-500',11),
  ('cn','Computer Networks',9,'Network','from-indigo-500 to-blue-500',12);
