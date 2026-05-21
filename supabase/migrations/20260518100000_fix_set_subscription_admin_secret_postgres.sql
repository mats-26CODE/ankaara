-- Allow setting admin secret from Supabase SQL Editor (postgres role).

CREATE OR REPLACE FUNCTION public.set_subscription_admin_secret(p_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $function$
BEGIN
  IF NOT (
    auth.role() = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR COALESCE(
      (SELECT rolsuper FROM pg_roles WHERE rolname = current_user LIMIT 1),
      false
    )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_secret IS NULL OR length(trim(p_secret)) < 12 THEN
    RAISE EXCEPTION 'Secret must be at least 12 characters';
  END IF;

  INSERT INTO private.subscription_admin_config (id, secret_hash, updated_at)
  VALUES (1, encode(extensions.digest(trim(p_secret), 'sha256'), 'hex'), now())
  ON CONFLICT (id) DO UPDATE
    SET secret_hash = EXCLUDED.secret_hash,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_subscription_admin_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_admin_secret(text) TO service_role, postgres;
