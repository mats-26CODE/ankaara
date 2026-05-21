-- Owner-only paid plan activation via a secret code (for testing / your own account).
-- Does not weaken webhook or client bypass: requires correct code + auth.uid().

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.subscription_admin_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE private.subscription_admin_config IS
  'Single-row store for SHA-256 hash of subscription admin activation code. Set via set_subscription_admin_secret (service_role only).';

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON private.subscription_admin_config FROM PUBLIC, anon, authenticated;

-- Allow paid plan changes when set by redeem_subscription_activation_code (same transaction).
CREATE OR REPLACE FUNCTION public.guard_paid_subscription_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_tier text;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.subscription_admin_override', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.subscription_plan_id IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT plan_tier INTO v_plan_tier
    FROM public.subscription_plans
    WHERE id = NEW.subscription_plan_id;
    IF v_plan_tier IS NOT NULL AND v_plan_tier <> 'free' THEN
      RAISE EXCEPTION 'PAID_PLAN_REQUIRES_PAYMENT';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.subscription_plan_id IS NOT DISTINCT FROM OLD.subscription_plan_id
      AND NEW.plan IS NOT DISTINCT FROM OLD.plan THEN
      RETURN NEW;
    END IF;

    IF NEW.subscription_plan_id IS NOT NULL THEN
      SELECT plan_tier INTO v_plan_tier
      FROM public.subscription_plans
      WHERE id = NEW.subscription_plan_id;
    ELSE
      SELECT plan_tier INTO v_plan_tier
      FROM public.subscription_plans
      WHERE slug = NEW.plan
      LIMIT 1;
    END IF;

    IF v_plan_tier IS NOT NULL AND v_plan_tier <> 'free' THEN
      RAISE EXCEPTION 'PAID_PLAN_REQUIRES_PAYMENT';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Set or rotate the admin code (SQL Editor as postgres, or service_role API).
CREATE OR REPLACE FUNCTION public.set_subscription_admin_secret(p_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $function$
BEGIN
  -- SQL Editor uses role postgres; auth.role() is not service_role there.
  IF NOT (
    auth.role() = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR COALESCE(
      (SELECT rolsuper FROM pg_roles WHERE rolname = current_user LIMIT 1),
      false
    )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_secret IS NULL OR length(trim(p_secret)) < 12 THEN
    RAISE EXCEPTION 'Secret must be at least 12 characters';
  END IF;

  INSERT INTO private.subscription_admin_config (id, secret_hash, updated_at)
  VALUES (1, encode(extensions.digest(trim(p_secret), 'sha256'), 'hex'), now())
  ON CONFLICT (id) DO UPDATE
    SET secret_hash = EXCLUDED.secret_hash,
        updated_at = EXCLUDED.updated_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_subscription_admin_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_admin_secret(text) TO service_role, postgres;

-- Redeem code: authenticated user can only upgrade their own subscription.
CREATE OR REPLACE FUNCTION public.redeem_subscription_activation_code(
  p_code text,
  p_plan_slug text DEFAULT 'business-monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_stored_hash text;
  v_plan record;
  v_sub_id uuid;
  v_end_date timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_code IS NULL OR length(trim(p_code)) < 1 THEN
    RAISE EXCEPTION 'Invalid activation code';
  END IF;

  SELECT secret_hash INTO v_stored_hash
  FROM private.subscription_admin_config
  WHERE id = 1;

  IF v_stored_hash IS NULL THEN
    RAISE EXCEPTION 'Admin activation is not configured';
  END IF;

  IF encode(extensions.digest(trim(p_code), 'sha256'), 'hex') IS DISTINCT FROM v_stored_hash THEN
    RAISE EXCEPTION 'Invalid activation code';
  END IF;

  SELECT id, slug, plan_tier, billing_interval
  INTO v_plan
  FROM public.subscription_plans
  WHERE slug = trim(p_plan_slug)
  LIMIT 1;

  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  IF v_plan.plan_tier NOT IN ('pro', 'business') THEN
    RAISE EXCEPTION 'Only paid plans can be activated with this code';
  END IF;

  v_end_date := now();
  IF v_plan.billing_interval = 'monthly' THEN
    v_end_date := v_end_date + interval '1 month';
  ELSIF v_plan.billing_interval = '6_month' THEN
    v_end_date := v_end_date + interval '6 months';
  ELSIF v_plan.billing_interval = 'yearly' THEN
    v_end_date := v_end_date + interval '1 year';
  ELSE
    v_end_date := NULL;
  END IF;

  PERFORM set_config('app.subscription_admin_override', '1', true);

  SELECT id INTO v_sub_id
  FROM public.subscriptions
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_sub_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET
      plan = v_plan.slug,
      subscription_plan_id = v_plan.id,
      status = 'active',
      start_date = now(),
      end_date = v_end_date
    WHERE id = v_sub_id;
  ELSE
    INSERT INTO public.subscriptions (user_id, plan, subscription_plan_id, status, start_date, end_date)
    VALUES (v_uid, v_plan.slug, v_plan.id, 'active', now(), v_end_date)
    RETURNING id INTO v_sub_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'subscription_id', v_sub_id,
    'plan_slug', v_plan.slug,
    'end_date', v_end_date
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.redeem_subscription_activation_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_subscription_activation_code(text, text) TO authenticated;

COMMENT ON FUNCTION public.redeem_subscription_activation_code(text, text) IS
  'Activates a paid plan for the current user only when p_code matches the configured admin secret hash.';
