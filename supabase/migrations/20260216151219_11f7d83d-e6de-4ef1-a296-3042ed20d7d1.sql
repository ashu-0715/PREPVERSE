
-- Add premium fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_activated_at timestamp with time zone;

-- Add note_type, price to notes
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS note_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'qr',
  payment_type text NOT NULL DEFAULT 'premium',
  note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create note_reviews table
CREATE TABLE public.note_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  stars integer NOT NULL CHECK (stars >= 1 AND stars <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(note_id, user_id)
);

ALTER TABLE public.note_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON public.note_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.note_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.note_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Create note_purchases table for paid notes
CREATE TABLE public.note_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(note_id, user_id)
);

ALTER TABLE public.note_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.note_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
ON public.note_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Note owners can view purchases of their notes"
ON public.note_purchases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.notes n WHERE n.id = note_purchases.note_id AND n.user_id = auth.uid()
));

-- Function to update note average rating when a review is added/updated
CREATE OR REPLACE FUNCTION public.update_note_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.notes
  SET rating = (SELECT AVG(stars) FROM public.note_reviews WHERE note_id = COALESCE(NEW.note_id, OLD.note_id)),
      rating_count = (SELECT COUNT(*) FROM public.note_reviews WHERE note_id = COALESCE(NEW.note_id, OLD.note_id))
  WHERE id = COALESCE(NEW.note_id, OLD.note_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_note_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.note_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_note_rating();

-- Drop the old prevent_rating_update trigger if it exists (since we now manage ratings via reviews)
DROP TRIGGER IF EXISTS prevent_rating_direct_update ON public.notes;
