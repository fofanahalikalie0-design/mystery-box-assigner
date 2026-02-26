
-- 1. Elections table
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;

-- 2. Candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 3. Voter approvals table (before votes, since votes policy references it)
CREATE TABLE public.voter_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  UNIQUE(user_id, election_id)
);
ALTER TABLE public.voter_approvals ENABLE ROW LEVEL SECURITY;

-- 4. Votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, voter_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for elections
CREATE POLICY "Super admins can manage elections" ON public.elections FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated users can view active elections" ON public.elections FOR SELECT USING (status = 'active');

-- RLS Policies for candidates
CREATE POLICY "Super admins can manage candidates" ON public.candidates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated can view candidates of active elections" ON public.candidates FOR SELECT USING (EXISTS (SELECT 1 FROM public.elections WHERE id = election_id AND status = 'active'));

-- RLS Policies for voter_approvals
CREATE POLICY "Users can request approval" ON public.voter_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own approval" ON public.voter_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage approvals" ON public.voter_approvals FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for votes
CREATE POLICY "Approved voters can cast votes" ON public.votes FOR INSERT WITH CHECK (
  auth.uid() = voter_id AND EXISTS (
    SELECT 1 FROM public.voter_approvals WHERE user_id = auth.uid() AND election_id = votes.election_id AND status = 'approved'
  )
);
CREATE POLICY "Users can view own votes" ON public.votes FOR SELECT USING (auth.uid() = voter_id);
CREATE POLICY "Super admins can view all votes" ON public.votes FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- Cast vote function
CREATE OR REPLACE FUNCTION public.cast_vote(p_election_id UUID, p_candidate_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_status TEXT; v_approved BOOLEAN; v_voted BOOLEAN;
BEGIN
  SELECT status INTO v_status FROM elections WHERE id = p_election_id;
  IF v_status IS NULL OR v_status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Election is not active.'); END IF;
  SELECT EXISTS(SELECT 1 FROM voter_approvals WHERE user_id = auth.uid() AND election_id = p_election_id AND status = 'approved') INTO v_approved;
  IF NOT v_approved THEN RETURN jsonb_build_object('success', false, 'error', 'You are not approved to vote.'); END IF;
  SELECT EXISTS(SELECT 1 FROM votes WHERE election_id = p_election_id AND voter_id = auth.uid()) INTO v_voted;
  IF v_voted THEN RETURN jsonb_build_object('success', false, 'error', 'You have already voted.'); END IF;
  INSERT INTO votes (election_id, candidate_id, voter_id) VALUES (p_election_id, p_candidate_id, auth.uid());
  UPDATE candidates SET vote_count = vote_count + 1 WHERE id = p_candidate_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN unique_violation THEN RETURN jsonb_build_object('success', false, 'error', 'You have already voted.');
END; $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-images', 'candidate-images', true);
CREATE POLICY "Super admins can upload candidate images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'candidate-images' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update candidate images" ON storage.objects FOR UPDATE USING (bucket_id = 'candidate-images' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete candidate images" ON storage.objects FOR DELETE USING (bucket_id = 'candidate-images' AND public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can view candidate images" ON storage.objects FOR SELECT USING (bucket_id = 'candidate-images');

-- Updated_at trigger
CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON public.elections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
