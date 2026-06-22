-- auth.refresh_tokens.user_id is varchar; auth.sessions.user_id is uuid.

CREATE OR REPLACE FUNCTION public.revoke_user_auth_sessions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;
