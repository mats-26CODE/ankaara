-- Default walk-in customer per business for POS sales.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS is_walk_in boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_one_walk_in_per_business
  ON public.clients(business_id)
  WHERE is_walk_in = true;

CREATE INDEX IF NOT EXISTS idx_clients_business_walk_in
  ON public.clients(business_id, is_walk_in);

COMMENT ON COLUMN public.clients.is_walk_in IS
  'System default client used for walk-in POS sales. Excluded from client limits and dashboard client counts.';

-- Exclude system walk-in clients from subscription client limits.
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

CREATE OR REPLACE FUNCTION public.trg_clients_check_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id uuid;
BEGIN
  IF COALESCE(NEW.is_walk_in, false) THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.ensure_walk_in_client(p_business_id uuid)
RETURNS public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_client public.clients%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  SELECT * INTO v_client
  FROM public.clients
  WHERE business_id = p_business_id
    AND is_walk_in = true
  LIMIT 1;

  IF FOUND THEN
    RETURN v_client;
  END IF;

  BEGIN
    INSERT INTO public.clients (business_id, name, is_walk_in)
    VALUES (p_business_id, 'Walk-in Customer', true)
    RETURNING * INTO v_client;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_client
    FROM public.clients
    WHERE business_id = p_business_id
      AND is_walk_in = true
    LIMIT 1;
  END;

  RETURN v_client;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_businesses_ensure_walk_in_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.clients (business_id, name, is_walk_in)
  VALUES (NEW.id, 'Walk-in Customer', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS businesses_ensure_walk_in_client ON public.businesses;
CREATE TRIGGER businesses_ensure_walk_in_client
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_businesses_ensure_walk_in_client();

INSERT INTO public.clients (business_id, name, is_walk_in)
SELECT b.id, 'Walk-in Customer', true
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1
  FROM public.clients c
  WHERE c.business_id = b.id
    AND c.is_walk_in = true
);

REVOKE ALL ON FUNCTION public.ensure_walk_in_client(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_walk_in_client(uuid) TO authenticated;
