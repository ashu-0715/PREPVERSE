-- Drop existing skill_posts table constraints to recreate with new structure
-- First, create enum types for the new fields
CREATE TYPE skill_post_type AS ENUM ('offer', 'request');
CREATE TYPE skill_category AS ENUM ('coding', 'design', 'academics', 'languages', 'soft_skills', 'music', 'sports', 'other');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE session_mode AS ENUM ('chat', 'voice_call', 'video_meeting');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE meeting_platform AS ENUM ('google_meet', 'zoom', 'in_app');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
CREATE TYPE session_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create new skill_posts_v2 table with comprehensive fields
CREATE TABLE public.skill_posts_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_type skill_post_type NOT NULL,
  skill_title TEXT NOT NULL,
  category skill_category NOT NULL DEFAULT 'other',
  skill_level skill_level NOT NULL DEFAULT 'beginner',
  description TEXT,
  preferred_mode session_mode NOT NULL DEFAULT 'chat',
  session_duration INTEGER DEFAULT 60, -- in minutes
  -- For request posts
  learning_goal TEXT,
  current_level skill_level,
  urgency urgency_level DEFAULT 'medium',
  -- AI generated image
  image_url TEXT,
  -- Engagement
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create availability slots table
CREATE TABLE public.skill_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.skill_posts_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create connections table for when users click "I Want to Learn" or "I Know This"
CREATE TABLE public.skill_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.skill_posts_v2(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL, -- User who clicked the button
  post_owner_id UUID NOT NULL, -- User who created the post
  status connection_status NOT NULL DEFAULT 'pending',
  connection_type session_mode DEFAULT 'chat',
  message TEXT, -- Optional intro message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sessions table for scheduled meetings
CREATE TABLE public.skill_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.skill_connections(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- in minutes
  meeting_platform meeting_platform NOT NULL DEFAULT 'google_meet',
  meeting_link TEXT,
  status session_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table for post-session feedback
CREATE TABLE public.skill_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.skill_sessions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, reviewer_id) -- One review per person per session
);

-- Create skill badges table
CREATE TABLE public.skill_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  criteria JSONB, -- Store criteria for earning the badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user skill badges junction table
CREATE TABLE public.user_skill_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.skill_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create skill post likes table to track who liked what
CREATE TABLE public.skill_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.skill_posts_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.skill_posts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_posts_v2
CREATE POLICY "Anyone can view skill posts" ON public.skill_posts_v2 FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON public.skill_posts_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.skill_posts_v2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.skill_posts_v2 FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for skill_availability
CREATE POLICY "Anyone can view availability" ON public.skill_availability FOR SELECT USING (true);
CREATE POLICY "Users can manage their own availability" ON public.skill_availability FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own availability" ON public.skill_availability FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own availability" ON public.skill_availability FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for skill_connections
CREATE POLICY "Users can view their connections" ON public.skill_connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = post_owner_id);
CREATE POLICY "Users can create connections" ON public.skill_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their connections" ON public.skill_connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = post_owner_id);

-- RLS Policies for skill_sessions
CREATE POLICY "Users can view their sessions" ON public.skill_sessions FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = learner_id);
CREATE POLICY "Users can create sessions they're part of" ON public.skill_sessions FOR INSERT WITH CHECK (auth.uid() = teacher_id OR auth.uid() = learner_id);
CREATE POLICY "Users can update their sessions" ON public.skill_sessions FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

-- RLS Policies for skill_reviews
CREATE POLICY "Anyone can view reviews" ON public.skill_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their sessions" ON public.skill_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policies for skill_badges
CREATE POLICY "Anyone can view badges" ON public.skill_badges FOR SELECT USING (true);

-- RLS Policies for user_skill_badges
CREATE POLICY "Anyone can view user badges" ON public.user_skill_badges FOR SELECT USING (true);

-- RLS Policies for skill_post_likes
CREATE POLICY "Anyone can view likes" ON public.skill_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.skill_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.skill_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.skill_badges (name, description, icon, criteria) VALUES
('Helpful Mentor', 'Taught 5+ successful sessions with great ratings', '🎓', '{"sessions_taught": 5, "min_rating": 4}'),
('Active Learner', 'Completed 5+ learning sessions', '📚', '{"sessions_learned": 5}'),
('Top SkillSharer', 'Received 10+ five-star reviews', '⭐', '{"five_star_reviews": 10}'),
('Rising Star', 'Completed first teaching session', '🌟', '{"sessions_taught": 1}'),
('Quick Learner', 'Completed first learning session', '🚀', '{"sessions_learned": 1}'),
('Community Champion', 'Created 10+ skill posts', '🏆', '{"posts_created": 10}');

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_skill_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.skill_posts_v2 SET likes = likes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.skill_posts_v2 SET likes = likes - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for likes
CREATE TRIGGER skill_post_likes_trigger
AFTER INSERT OR DELETE ON public.skill_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_skill_post_likes();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_skill_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_skill_posts_v2_updated_at
BEFORE UPDATE ON public.skill_posts_v2
FOR EACH ROW EXECUTE FUNCTION public.update_skill_updated_at();

CREATE TRIGGER update_skill_connections_updated_at
BEFORE UPDATE ON public.skill_connections
FOR EACH ROW EXECUTE FUNCTION public.update_skill_updated_at();

CREATE TRIGGER update_skill_sessions_updated_at
BEFORE UPDATE ON public.skill_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_skill_updated_at();