-- Add 6-month and yearly subscription intervals.
-- - Add plan_tier (free | pro | business) for grouping; keep slug as product id (pro-monthly, pro-6month, pro-yearly).
-- - Rename slug 'pro' -> 'pro-monthly'; add rows pro-6month, pro-yearly with same feature limits.
-- check_plan_limit is unchanged: it uses subscription_plan_id and does not depend on interval.

-- =============================================================================
-- 1. Add plan_tier column
-- =============================================================================
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS plan_tier text;

UPDATE public.subscription_plans
SET plan_tier = CASE
  WHEN slug = 'free' THEN 'free'
  WHEN slug IN ('pro', 'pro-monthly', 'pro-6month', 'pro-yearly') THEN 'pro'
  WHEN slug IN ('business', 'business-monthly', 'business-6month', 'business-yearly') THEN 'business'
  ELSE 'free'
END
WHERE plan_tier IS NULL OR plan_tier NOT IN ('free', 'pro', 'business');

ALTER TABLE public.subscription_plans
  ALTER COLUMN plan_tier SET NOT NULL;

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_plan_tier_check;
ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_plan_tier_check
  CHECK (plan_tier IN ('free', 'pro', 'business'));

COMMENT ON COLUMN public.subscription_plans.plan_tier IS 'Logical tier for grouping: free, pro, business. Pro tier has multiple slugs (pro-monthly, pro-6month, pro-yearly).';

-- =============================================================================
-- 2. Rename pro -> pro-monthly, allow new slugs and 6_month interval
-- =============================================================================
-- Drop slug check first so we can update 'pro' -> 'pro-monthly'
ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_slug_check;

UPDATE public.subscription_plans SET slug = 'pro-monthly' WHERE slug = 'pro';

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_slug_check
  CHECK (slug IN ('free', 'pro-monthly', 'pro-6month', 'pro-yearly', 'business'));

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_billing_interval_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_billing_interval_check
  CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', '6_month', 'yearly'));

-- =============================================================================
-- 3. Insert Pro 6-month and Pro Yearly plans (same features as Pro)
-- =============================================================================
INSERT INTO public.subscription_plans (slug, name, description, price_amount, price_currency, billing_interval, is_contact_sales, sort_order, plan_tier)
VALUES
  ('pro-6month', 'Pro Plan (6 Months)', 'For growing businesses — pay every 6 months', 99.00, 'USD', '6_month', false, 3, 'pro'),
  ('pro-yearly', 'Pro Plan (Yearly)', 'For growing businesses — pay annually', 199.00, 'USD', 'yearly', false, 4, 'pro')
ON CONFLICT (slug) DO NOTHING;

-- Business sort_order stays 5 (or 3 in original; we use 5 so order is free=1, pro-monthly=2, pro-6month=3, pro-yearly=4, business=5)
UPDATE public.subscription_plans SET sort_order = 5 WHERE slug = 'business';

-- =============================================================================
-- 4. Copy subscription_plan_features from pro-monthly to pro-6month and pro-yearly
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT p.id, f.feature_key, f.limit_type, f.limit_value
FROM public.subscription_plan_features f
JOIN public.subscription_plans src ON src.id = f.subscription_plan_id AND src.slug = 'pro-monthly'
JOIN public.subscription_plans p ON p.slug IN ('pro-6month', 'pro-yearly')
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

-- =============================================================================
-- 5. Backfill subscriptions.plan: 'pro' -> 'pro-monthly' for existing rows
-- =============================================================================
UPDATE public.subscriptions
SET plan = 'pro-monthly'
WHERE plan = 'pro';
