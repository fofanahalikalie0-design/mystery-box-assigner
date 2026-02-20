
-- Function to assign super_admin role
CREATE OR REPLACE FUNCTION public.assign_super_admin_role(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
