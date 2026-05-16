-- Free: 10 sales per calendar month (by sale_date).
-- Pro: unlimited clients, 50 products/services, unlimited sales.
-- Business: unlimited sales (explicit feature row).

-- =============================================================================
-- 1. Plan feature rows
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'sales_per_month', 'number', 10
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'clients_per_business', 'unlimited', null
  FROM public.subscription_plans
  WHERE plan_tier = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'number', 50
  FROM public.subscription_plans
  WHERE plan_tier = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'sales_per_month', 'unlimited', null
  FROM public.subscription_plans
  WHERE plan_tier IN ('pro', 'business')
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

-- =============================================================================
-- 2. Extend check_plan_limit for sales_per_month
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

  IF p_feature_key = 'invoices_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.invoices i
    INNER JOIN public.businesses b ON b.id = i.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', i.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'quotations_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.quotations q
    INNER JOIN public.businesses b ON b.id = q.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', q.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'sales_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.sales s
    INNER JOIN public.businesses b ON b.id = s.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', s.sale_date) = date_trunc('month', now());
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
    WHERE business_id = v_business_id
      AND is_walk_in = false;
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

-- =============================================================================
-- 3. Trigger: sales (before insert)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_sales_check_plan_limit()
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
    PERFORM public.check_plan_limit(v_owner_id, 'sales_per_month', NULL);
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sales_check_plan_limit ON public.sales;
CREATE TRIGGER sales_check_plan_limit
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_sales_check_plan_limit();
