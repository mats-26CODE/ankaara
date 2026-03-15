-- Fix plan limit enforcement: ensure clients_per_business and products_per_business
-- (and businesses_count, invoices_per_month) are enforced. Single check_plan_limit
-- function and all triggers recreated.

-- =============================================================================
-- 1. Ensure subscription_plan_features exist for all plans (upsert)
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'number', 5
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'number', 1
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'clients_per_business', 'number', 10
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'number', 10
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

-- Pro
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'number', 50
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'clients_per_business', 'number', 30
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'number', 30
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

-- Business
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'clients_per_business', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

-- =============================================================================
-- 2. Single check_plan_limit(uuid, text, jsonb) — all four features
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
  -- Resolve plan: user's active subscription, or fall back to free plan
  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND (s.status IS NULL OR s.status = 'active')
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
  'Raises PLAN_LIMIT:<feature_key> if user has reached plan limit. Used by BEFORE INSERT triggers. Handles invoices_per_month, businesses_count, clients_per_business (context business_id), products_per_business (context business_id).';

-- =============================================================================
-- 3. Trigger: invoices (2-arg call; p_context defaults to NULL)
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
    PERFORM public.check_plan_limit(v_owner_id, 'invoices_per_month', NULL);
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
-- 4. Trigger: businesses (2-arg call)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_businesses_check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    PERFORM public.check_plan_limit(NEW.owner_id, 'businesses_count', NULL);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS businesses_check_plan_limit ON public.businesses;
CREATE TRIGGER businesses_check_plan_limit
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_businesses_check_plan_limit();

-- =============================================================================
-- 5. Trigger: clients (3-arg with context)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_clients_check_plan_limit()
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
    PERFORM public.check_plan_limit(
      v_owner_id,
      'clients_per_business',
      jsonb_build_object('business_id', NEW.business_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS clients_check_plan_limit ON public.clients;
CREATE TRIGGER clients_check_plan_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_clients_check_plan_limit();

-- =============================================================================
-- 6. Trigger: products (3-arg with context)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_products_check_plan_limit()
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
    PERFORM public.check_plan_limit(
      v_owner_id,
      'products_per_business',
      jsonb_build_object('business_id', NEW.business_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS products_check_plan_limit ON public.products;
CREATE TRIGGER products_check_plan_limit
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_products_check_plan_limit();
