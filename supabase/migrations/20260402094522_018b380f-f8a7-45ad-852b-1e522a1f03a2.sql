
-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update subjects" ON public.subjects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete subjects" ON public.subjects FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default subjects
INSERT INTO public.subjects (name) VALUES
  ('Mathematics'), ('Physics'), ('Chemistry'), ('Computer Science'), ('Electronics'),
  ('Data Structures'), ('Algorithms'), ('Database Management'), ('Operating Systems'),
  ('Computer Networks'), ('Web Development'), ('Machine Learning'), ('Artificial Intelligence'),
  ('Software Engineering'), ('Other')
ON CONFLICT (name) DO NOTHING;

-- Create premium_plans table
CREATE TABLE public.premium_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 199,
  billing_duration TEXT NOT NULL DEFAULT 'one-time',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  cta_text TEXT DEFAULT 'Go Premium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.premium_plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert plans" ON public.premium_plans FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update plans" ON public.premium_plans FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete plans" ON public.premium_plans FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default premium plan
INSERT INTO public.premium_plans (plan_name, price, billing_duration, benefits, description, cta_text) VALUES
  ('Premium Plan', 199, 'one-time',
   ARRAY['View & download premium-only notes', 'Publish notes as paid content', 'Access exclusive study materials', 'Crown badge on your profile', 'Priority support'],
   'Unlock all premium features with a one-time payment', 'I''ve Paid — Submit for Verification');

-- Add image_urls column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
