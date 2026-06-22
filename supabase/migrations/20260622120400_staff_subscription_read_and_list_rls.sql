-- Staff can read owner subscription via RPC; staff managers can list all team members.

CREATE OR REPLACE FUNCTION public.get_effective_subscription(p_business_id uuid DEFAULT NULL)
RETURNS TABLE(plan_slug text, end_date timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_billing_user_id uuid;
BEGIN
  v_billing_user_id := public.resolve_subscription_user_id(auth.uid(), p_business_id);

  IF v_billing_user_id IS NULL THEN
    RETURN QUERY SELECT 'free'::text, NULL::timestamptz;
    RETURN;
  END IF;

  PERFORM public.check_subscription_expiry(v_billing_user_id);

  RETURN QUERY
  SELECT COALESCE(s.plan, 'free')::text, s.end_date
  FROM public.subscriptions s
  WHERE s.user_id = v_billing_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'free'::text, NULL::timestamptz;
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_effective_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_subscription(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_effective_subscription IS
  'Returns the subscription plan for auth.uid(), or the business owner plan when the caller is staff.';

DROP POLICY IF EXISTS "Read business staff" ON public.business_staff;

CREATE POLICY "Read business staff"
  ON public.business_staff FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_business_owner(business_id)
    OR public.staff_can(business_id, 'staff_management', 'view')
  );
