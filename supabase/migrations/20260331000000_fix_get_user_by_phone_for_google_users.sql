-- Fix get_user_by_phone to return users who linked phone via Google sign-up
-- Previously it only returned users with raw_user_meta_data->>'user_type' = 'user'
-- Google users who link phone via verify-otp don't have user_type, so they were excluded.
-- Result: get_user_by_phone returned empty, then createUser failed with "phone already registered"

CREATE OR REPLACE FUNCTION public.get_user_by_phone(phone_number text)
RETURNS TABLE(id uuid, phone text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN QUERY
    SELECT auth.users.id, auth.users.phone
    FROM auth.users
    WHERE auth.users.phone = phone_number;
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;
END;
$function$;
