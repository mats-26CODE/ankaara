-- Prevent users from upgrading to paid plans via the client API (only free self-serve).
-- Paid activations go through edge functions (service_role) after payment webhooks.

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

DROP TRIGGER IF EXISTS subscriptions_guard_paid_plan ON public.subscriptions;
CREATE TRIGGER subscriptions_guard_paid_plan
  BEFORE INSERT OR UPDATE OF subscription_plan_id, plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.guard_paid_subscription_plan_change();

COMMENT ON FUNCTION public.guard_paid_subscription_plan_change() IS
  'Blocks authenticated users from assigning pro/business plans. Service role (edge functions) may activate paid plans after payment.';

-- Idempotent payment activation (same gateway reference cannot activate twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payments_provider_reference_unique
  ON public.subscription_payments(provider_reference)
  WHERE provider_reference IS NOT NULL;
