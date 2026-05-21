-- subscriptions.plan stored full slugs (pro-monthly, business-yearly, etc.)
-- but CHECK still only allowed free|pro|business.

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

CREATE OR REPLACE FUNCTION public.validate_subscription_plan_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.plan IS NULL OR trim(NEW.plan) = '' THEN
    RAISE EXCEPTION 'subscription plan slug is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_plans sp WHERE sp.slug = NEW.plan
  ) THEN
    RAISE EXCEPTION 'Invalid subscription plan slug: %', NEW.plan;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS subscriptions_validate_plan_slug ON public.subscriptions;
CREATE TRIGGER subscriptions_validate_plan_slug
  BEFORE INSERT OR UPDATE OF plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.validate_subscription_plan_slug();

COMMENT ON COLUMN public.subscriptions.plan IS
  'Plan slug from subscription_plans (e.g. free, pro-monthly, business-yearly).';
