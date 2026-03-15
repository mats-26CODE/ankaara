-- 1. check_plan_limit: only use subscription if still in period (end_date not passed).
--    invoices_per_month already counts current calendar month; limits reset each month.
-- 2. check_subscription_expiry: call on login to reset expired paid plans to free.

-- =============================================================================
-- 1. check_plan_limit: ignore subscriptions past end_date
-- =============================================================================
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
BEGIN
  -- Resolve plan: user's active subscription still in period (end_date not passed), or fall back to free.
  -- Limits (e.g. invoices_per_month) use current calendar month; they reset each month.
  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
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

  -- Compute current usage (before this insert)
  -- invoices_per_month: count in current calendar month; resets next month
  IF p_feature_key = 'invoices_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.invoices i
    INNER JOIN public.businesses b ON b.id = i.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', i.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'businesses_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.businesses
    WHERE owner_id = p_user_id;
  ELSIF p_feature_key = 'clients_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.clients
    WHERE business_id = v_business_id;
  ELSIF p_feature_key = 'products_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.products
    WHERE business_id = v_business_id;
  ELSE
    RETURN;
  END IF;

  IF v_current_usage >= v_limit_value THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  RETURN;
END;
$function$;

COMMENT ON FUNCTION public.check_plan_limit(uuid, text, jsonb) IS
  'Raises PLAN_LIMIT:<feature_key> if user has reached plan limit. Uses subscription only when end_date is null or in future. invoices_per_month counts current calendar month (resets each month). Call check_subscription_expiry on login to reset expired plans to free.';

-- =============================================================================
-- 2. check_subscription_expiry: reset expired paid plans to free (call on login)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_subscription_expiry(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sub_id uuid;
  v_free_plan_id uuid;
  v_plan_slug text;
BEGIN
  -- Only allow a user to check their own subscription
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN false;
  END IF;

  -- Find active subscription that has passed end_date
  SELECT s.id, sp.slug INTO v_sub_id, v_plan_slug
  FROM public.subscriptions s
  LEFT JOIN public.subscription_plans sp ON sp.id = s.subscription_plan_id
  WHERE s.user_id = p_user_id
    AND (s.status IS NULL OR s.status = 'active')
    AND s.end_date IS NOT NULL
    AND s.end_date < now()
  ORDER BY s.start_date DESC NULLS LAST
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    RETURN false;
  END IF;

  -- Free plan: do not "expire" (no-op)
  IF v_plan_slug = 'free' THEN
    RETURN false;
  END IF;

  -- Get free plan id
  SELECT id INTO v_free_plan_id
  FROM public.subscription_plans
  WHERE slug = 'free'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.subscriptions
  SET status = 'expired',
      plan = 'free',
      subscription_plan_id = v_free_plan_id
  WHERE id = v_sub_id;

  RETURN true;
END;
$function$;

COMMENT ON FUNCTION public.check_subscription_expiry(uuid) IS
  'If the user has an active subscription with end_date in the past, sets it to expired and resets plan to free. Call after login (e.g. from useCurrentSubscription). Returns true if an expiry was applied.';
