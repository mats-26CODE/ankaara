-- Add quotations_count (unlimited) to all Pro and Business plans.
-- The original migration used slug='pro' and slug='business' which were renamed
-- to pro-monthly, pro-6month, pro-yearly and business-monthly, etc.
-- Use plan_tier to add unlimited quotations to all non-free plans.

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'quotations_count', 'unlimited', null
  FROM public.subscription_plans
  WHERE plan_tier IN ('pro', 'business')
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type, limit_value = EXCLUDED.limit_value;
