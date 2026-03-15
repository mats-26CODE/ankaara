-- Add Business Monthly for consistency with Pro (monthly, 6-month, yearly).
-- Rename existing 'business' row to 'business-monthly' and set billing_interval.

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_slug_check;

UPDATE public.subscription_plans
SET slug = 'business-monthly', billing_interval = 'monthly'
WHERE slug = 'business';

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_slug_check
  CHECK (slug IN (
    'free', 'pro-monthly', 'pro-6month', 'pro-yearly',
    'business-monthly', 'business-6month', 'business-yearly'
  ));

-- Backfill subscriptions.plan for existing Business customers
UPDATE public.subscriptions
SET plan = 'business-monthly'
WHERE plan = 'business';
