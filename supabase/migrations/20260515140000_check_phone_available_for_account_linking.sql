-- Allow authenticated users to check if a phone can be linked to their account
-- (e.g. Google onboarding) before sending OTP. get_user_by_phone remains service_role-only.

CREATE OR REPLACE FUNCTION public.check_phone_available_for_account_linking(phone_number text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text;
  v_existing uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF phone_number IS NULL OR btrim(phone_number) = '' THEN
    RAISE EXCEPTION 'phone_number is required';
  END IF;

  v_norm := regexp_replace(btrim(phone_number), '^\+', '');

  SELECT u.id INTO v_existing
  FROM auth.users AS u
  WHERE regexp_replace(coalesce(u.phone, ''), '^\+', '') = v_norm
  LIMIT 1;

  IF v_existing IS NULL THEN
    RETURN jsonb_build_object('available', true);
  END IF;

  IF v_existing = v_uid THEN
    RETURN jsonb_build_object('available', true, 'already_linked', true);
  END IF;

  RETURN jsonb_build_object('available', false);
END;
$function$;

COMMENT ON FUNCTION public.check_phone_available_for_account_linking(text) IS
  'Authenticated: available=true if phone is unused or already on this auth user; false if another user owns it.';

REVOKE ALL ON FUNCTION public.check_phone_available_for_account_linking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_phone_available_for_account_linking(text) TO authenticated;
