
-- 1. Create site_settings table
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'MegaOdds',
  site_mode text NOT NULL DEFAULT 'mystery_boxes' CHECK (site_mode IN ('elections', 'mystery_boxes')),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view site settings"
ON public.site_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Super admins can update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT TO anon
USING (true);

INSERT INTO public.site_settings (site_name, site_mode) VALUES ('MegaOdds', 'mystery_boxes');

-- 2. Create device_votes table
CREATE TABLE public.device_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  election_id uuid NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(device_id, election_id)
);

ALTER TABLE public.device_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert device votes"
ON public.device_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Super admins can view device votes"
ON public.device_votes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own device votes"
ON public.device_votes FOR SELECT TO authenticated
USING (auth.uid() = voter_id);

-- 3. Moderator RLS policies
CREATE POLICY "Moderators can manage elections"
ON public.elections FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can manage candidates"
ON public.candidates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can manage approvals"
ON public.voter_approvals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can view all votes"
ON public.votes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Moderators can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'moderator'));

-- 4. Super admin role management
CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
