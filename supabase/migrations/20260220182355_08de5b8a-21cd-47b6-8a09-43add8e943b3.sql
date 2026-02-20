
-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_assigned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_categories mapping table
CREATE TABLE public.admin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  revealed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (admin_id, category_id),
  UNIQUE (category_id)  -- ensures each category assigned to only one admin
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_categories ENABLE ROW LEVEL SECURITY;

-- Categories: any authenticated user can read (needed to show mystery boxes)
CREATE POLICY "Authenticated users can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Admin categories: users can only see their own assignments
CREATE POLICY "Users can view their own category assignments"
  ON public.admin_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = admin_id);

-- Admin categories: users can insert their own (picking a category)
CREATE POLICY "Users can assign categories to themselves"
  ON public.admin_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

-- Function to atomically assign a category to an admin
CREATE OR REPLACE FUNCTION public.assign_category_to_admin(
  p_admin_id UUID,
  p_category_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_count INT;
  v_cat_assigned BOOLEAN;
  v_cat_name TEXT;
BEGIN
  -- Check how many categories admin already has
  SELECT COUNT(*) INTO v_already_count
  FROM public.admin_categories
  WHERE admin_id = p_admin_id;

  IF v_already_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have 2 categories assigned.');
  END IF;

  -- Check category is not already assigned
  SELECT is_assigned INTO v_cat_assigned
  FROM public.categories
  WHERE id = p_category_id;

  IF v_cat_assigned THEN
    RETURN jsonb_build_object('success', false, 'error', 'This category is already taken. Please pick another one.');
  END IF;

  -- Assign category
  INSERT INTO public.admin_categories (admin_id, category_id)
  VALUES (p_admin_id, p_category_id);

  -- Mark category as assigned
  UPDATE public.categories SET is_assigned = true WHERE id = p_category_id;

  -- Get category name to return
  SELECT name INTO v_cat_name FROM public.categories WHERE id = p_category_id;

  RETURN jsonb_build_object('success', true, 'category_name', v_cat_name);

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'error', 'This category is already taken. Please pick another one.');
END;
$$;

-- Seed 20 categories
INSERT INTO public.categories (name) VALUES
  ('Category 1'), ('Category 2'), ('Category 3'), ('Category 4'), ('Category 5'),
  ('Category 6'), ('Category 7'), ('Category 8'), ('Category 9'), ('Category 10'),
  ('Category 11'), ('Category 12'), ('Category 13'), ('Category 14'), ('Category 15'),
  ('Category 16'), ('Category 17'), ('Category 18'), ('Category 19'), ('Category 20');
