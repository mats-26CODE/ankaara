-- Block suspended/removed staff from authenticating and revoke auth sessions on suspend/remove.

CREATE OR REPLACE FUNCTION public.staff_user_can_authenticate(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (
      SELECT account_type FROM public.profiles WHERE id = p_user_id
    ) = 'owner'::public.account_type THEN true
    WHEN EXISTS (
      SELECT 1
      FROM public.business_staff bs
      WHERE bs.user_id = p_user_id
        AND bs.status IN ('pending', 'active')
    ) THEN true
    ELSE false
  END;
$$;

COMMENT ON FUNCTION public.staff_user_can_authenticate(uuid) IS
  'Owners may always authenticate. Staff may authenticate only with a pending or active membership.';

CREATE OR REPLACE FUNCTION public.revoke_user_auth_sessions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.revoke_user_auth_sessions(uuid) IS
  'Removes all Supabase Auth sessions and refresh tokens for a user (e.g. staff suspended).';

CREATE OR REPLACE FUNCTION public.handle_business_staff_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.status IN ('suspended', 'removed')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.revoke_user_auth_sessions(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_staff_status_revoke_sessions ON public.business_staff;
CREATE TRIGGER business_staff_status_revoke_sessions
  AFTER UPDATE OF status ON public.business_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_business_staff_status_change();

REVOKE ALL ON FUNCTION public.staff_user_can_authenticate(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_user_auth_sessions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_business_staff_status_change() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.staff_user_can_authenticate(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_user_auth_sessions(uuid) TO service_role;
