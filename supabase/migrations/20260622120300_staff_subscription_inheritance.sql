-- Staff inherit the business owner's subscription for plan gates and limits.

CREATE OR REPLACE FUNCTION public.resolve_subscription_user_id(
  p_user_id uuid,
  p_business_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_business_id IS NOT NULL THEN
    SELECT b.owner_id INTO v_owner_id
    FROM public.businesses b
    WHERE b.id = p_business_id;

    IF v_owner_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.business_staff bs
        WHERE bs.user_id = p_user_id
          AND bs.business_id = p_business_id
          AND bs.status IN ('pending', 'active')
      ) THEN
      RETURN v_owner_id;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.account_type = 'staff'
  ) THEN
    SELECT b.owner_id INTO v_owner_id
    FROM public.business_staff bs
    INNER JOIN public.businesses b ON b.id = bs.business_id
    WHERE bs.user_id = p_user_id
      AND bs.status IN ('pending', 'active')
    ORDER BY bs.invited_at DESC NULLS LAST
    LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
      RETURN v_owner_id;
    END IF;
  END IF;

  RETURN p_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_subscription_user_id(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_subscription_user_id(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.require_plan_feature(
  p_user_id uuid,
  p_feature_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id uuid;
  v_limit_type text;
  v_billing_user_id uuid;
BEGIN
  v_billing_user_id := public.resolve_subscription_user_id(p_user_id, NULL);

  IF v_billing_user_id IS NULL THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = v_billing_user_id
    AND (s.status IS NULL OR s.status = 'active')
    AND (s.end_date IS NULL OR s.end_date >= now())
  ORDER BY s.start_date DESC NULLS LAST
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  SELECT f.limit_type INTO v_limit_type
  FROM public.subscription_plan_features f
  WHERE f.subscription_plan_id = v_plan_id
    AND f.feature_key = p_feature_key
  LIMIT 1;

  IF v_limit_type IS DISTINCT FROM 'unlimited' THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_user_id uuid,
  p_feature_key text,
  p_context jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id uuid;
  v_limit_type text;
  v_limit_value numeric;
  v_current_usage bigint;
  v_business_id uuid;
  v_billing_user_id uuid;
BEGIN
  v_business_id := (p_context->>'business_id')::uuid;
  v_billing_user_id := public.resolve_subscription_user_id(p_user_id, v_business_id);

  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = v_billing_user_id
    AND (s.status IS NULL OR s.status = 'active')
    AND (s.end_date IS NULL OR s.end_date >= now())
  ORDER BY s.start_date DESC NULLS LAST
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RETURN;
  END IF;

  SELECT f.limit_type, f.limit_value INTO v_limit_type, v_limit_value
  FROM public.subscription_plan_features f
  WHERE f.subscription_plan_id = v_plan_id
    AND f.feature_key = p_feature_key
  LIMIT 1;

  IF v_limit_type IS NULL OR v_limit_type = 'unlimited' THEN
    RETURN;
  END IF;

  IF v_limit_value IS NULL THEN
    RETURN;
  END IF;

  IF p_feature_key = 'invoices_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.invoices i
    INNER JOIN public.businesses b ON b.id = i.business_id AND b.owner_id = v_billing_user_id
    WHERE date_trunc('month', i.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'quotations_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.quotations q
    INNER JOIN public.businesses b ON b.id = q.business_id AND b.owner_id = v_billing_user_id
    WHERE date_trunc('month', q.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'sales_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.sales s
    INNER JOIN public.businesses b ON b.id = s.business_id AND b.owner_id = v_billing_user_id
    WHERE date_trunc('month', s.sale_date) = date_trunc('month', now());
  ELSIF p_feature_key = 'businesses_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.businesses
    WHERE owner_id = v_billing_user_id;
  ELSIF p_feature_key = 'clients_per_business' THEN
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.clients
    WHERE business_id = v_business_id
      AND is_walk_in = false;
  ELSIF p_feature_key = 'products_per_business' THEN
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.products
    WHERE business_id = v_business_id;
  ELSIF p_feature_key = 'staff_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.business_staff bs
    INNER JOIN public.businesses b ON b.id = bs.business_id
    WHERE b.owner_id = v_billing_user_id
      AND bs.status IN ('pending', 'active');
  ELSE
    RETURN;
  END IF;

  IF v_current_usage >= v_limit_value THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.resolve_subscription_user_id IS
  'Returns the business owner user id when p_user_id is staff for the business; otherwise p_user_id. Used for plan feature/limit checks.';
