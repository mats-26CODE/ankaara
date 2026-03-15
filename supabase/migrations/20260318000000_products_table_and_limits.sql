-- Products / services catalog per business: users can add items and attach them when creating invoices.
-- Plan limits: Free 10, Pro 30, Business unlimited (products_per_business).

-- =============================================================================
-- 1. PRODUCTS TABLE
-- =============================================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_business ON public.products(business_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD products of own businesses"
  ON public.products
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.products IS 'Products or services per business; can be attached as line items when creating invoices.';

-- =============================================================================
-- 2. Seed subscription_plan_features: products_per_business
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'number', 10
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'number', 30
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'products_per_business', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;

-- =============================================================================
-- 3. Extend check_plan_limit: products_per_business
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
    AND s.status = 'active'
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
  ELSIF p_feature_key = 'businesses_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.businesses
    WHERE owner_id = p_user_id;
  ELSIF p_feature_key = 'clients_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN RETURN; END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.clients
    WHERE business_id = v_business_id;
  ELSIF p_feature_key = 'products_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN RETURN; END IF;
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
-- 4. Trigger: products — check products_per_business before insert
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
