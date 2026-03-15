-- Subscription plan limit enforcement: check_plan_limit() and BEFORE INSERT triggers.
-- When a user exceeds their plan limit (e.g. invoices_per_month, businesses_count),
-- the insert fails with SQLSTATE 'PLIMT' and message 'PLAN_LIMIT:<feature_key>' so
-- the app can redirect to /subscribe.

-- =============================================================================
-- 1. check_plan_limit(p_user_id, p_feature_key)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(
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
  v_limit_value numeric;
  v_current_usage bigint;
BEGIN
  -- Resolve plan: user's active subscription, or fall back to free plan if none
  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RETURN; -- No plans at all; allow (should not happen if seeds applied)
  END IF;

  -- Get feature limit for this plan
  SELECT f.limit_type, f.limit_value INTO v_limit_type, v_limit_value
  FROM public.subscription_plan_features f
  WHERE f.subscription_plan_id = v_plan_id
    AND f.feature_key = p_feature_key
  LIMIT 1;

  IF v_limit_type IS NULL OR v_limit_type = 'unlimited' THEN
    RETURN; -- No row or unlimited: allow
  END IF;

  IF v_limit_value IS NULL THEN
    RETURN; -- Unlimited (null value)
  END IF;

  -- Compute current usage by feature
  IF p_feature_key = 'invoices_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.invoices i
    INNER JOIN public.businesses b ON b.id = i.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', i.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'businesses_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.businesses
    WHERE owner_id = p_user_id;
  ELSE
    RETURN; -- Unknown feature: allow
  END IF;

  IF v_current_usage >= v_limit_value THEN
    -- Message format PLAN_LIMIT:<feature_key> so app can redirect to /subscribe
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  RETURN;
END;
$function$;

COMMENT ON FUNCTION public.check_plan_limit(uuid, text) IS
  'Raises if user has reached plan limit for feature_key (message contains PLAN_LIMIT:<key>). Used by BEFORE INSERT triggers. App should redirect to /subscribe on this error.';

-- =============================================================================
-- 2. Trigger: invoices — check invoices_per_month before insert
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_invoices_check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.businesses
  WHERE id = NEW.business_id
  LIMIT 1;

  IF v_owner_id IS NOT NULL THEN
    PERFORM public.check_plan_limit(v_owner_id, 'invoices_per_month');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS invoices_check_plan_limit ON public.invoices;
CREATE TRIGGER invoices_check_plan_limit
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_invoices_check_plan_limit();

-- =============================================================================
-- 3. Trigger: businesses — check businesses_count before insert
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_businesses_check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    PERFORM public.check_plan_limit(NEW.owner_id, 'businesses_count');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS businesses_check_plan_limit ON public.businesses;
CREATE TRIGGER businesses_check_plan_limit
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_businesses_check_plan_limit();
