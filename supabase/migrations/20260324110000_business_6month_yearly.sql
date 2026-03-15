-- Business plan: add 6-month and yearly options so staff can set subscription
-- according to customer preference when they contact.

-- =============================================================================
-- 1. Allow new Business slugs
-- =============================================================================
ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_slug_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_slug_check
  CHECK (slug IN (
    'free', 'pro-monthly', 'pro-6month', 'pro-yearly',
    'business', 'business-6month', 'business-yearly'
  ));

-- =============================================================================
-- 2. Insert Business 6-month and Business Yearly (contact sales; same features)
-- =============================================================================
INSERT INTO public.subscription_plans (slug, name, description, price_amount, price_currency, billing_interval, is_contact_sales, sort_order, plan_tier)
VALUES
  ('business-6month', 'Business Plan (6 Months)', 'Custom solution — 6 month billing. Contact us for pricing.', null, 'USD', '6_month', true, 6, 'business'),
  ('business-yearly', 'Business Plan (Yearly)', 'Custom solution — annual billing. Contact us for pricing.', null, 'USD', 'yearly', true, 7, 'business')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 3. Copy subscription_plan_features from business to business-6month, business-yearly
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT p.id, f.feature_key, f.limit_type, f.limit_value
FROM public.subscription_plan_features f
JOIN public.subscription_plans src ON src.id = f.subscription_plan_id AND src.slug = 'business'
JOIN public.subscription_plans p ON p.slug IN ('business-6month', 'business-yearly')
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;
