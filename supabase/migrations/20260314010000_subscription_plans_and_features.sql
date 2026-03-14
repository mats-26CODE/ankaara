-- Subscription plans and features: store plans in DB (Free, Pro, Business)
-- with pricing and feature limits (invoice count, business count).
-- Subscriptions link to subscription_plans; subscription_payments track SaaS billing separately from invoice_payments.

-- =============================================================================
-- 1. SUBSCRIPTION PLANS (catalog: free, pro, business)
-- =============================================================================
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE CHECK (slug IN ('free', 'pro', 'business')),
  name text NOT NULL,
  description text,
  price_amount numeric(14,2),
  price_currency text DEFAULT 'USD',
  billing_interval text CHECK (billing_interval IN ('monthly', 'yearly')),
  is_contact_sales boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_subscription_plans_slug ON public.subscription_plans(slug);
CREATE INDEX idx_subscription_plans_sort ON public.subscription_plans(sort_order);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (for pricing page)
CREATE POLICY "Anyone can read subscription_plans"
  ON public.subscription_plans FOR SELECT
  USING (true);

COMMENT ON TABLE public.subscription_plans IS 'Catalog of subscription plans (Free, Pro, Business).';
COMMENT ON COLUMN public.subscription_plans.price_amount IS 'Null for free or contact-sales (Business).';
COMMENT ON COLUMN public.subscription_plans.is_contact_sales IS 'True for Business plan (custom pricing).';

-- =============================================================================
-- 2. SUBSCRIPTION PLAN FEATURES (limits per plan)
-- =============================================================================
CREATE TABLE public.subscription_plan_features (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  limit_type text NOT NULL CHECK (limit_type IN ('number', 'unlimited')),
  limit_value numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_plan_id, feature_key)
);

CREATE INDEX idx_subscription_plan_features_plan ON public.subscription_plan_features(subscription_plan_id);

ALTER TABLE public.subscription_plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription_plan_features"
  ON public.subscription_plan_features FOR SELECT
  USING (true);

COMMENT ON TABLE public.subscription_plan_features IS 'Feature limits per plan (e.g. invoices_per_month, businesses_count).';
COMMENT ON COLUMN public.subscription_plan_features.feature_key IS 'e.g. invoices_per_month, businesses_count';
COMMENT ON COLUMN public.subscription_plan_features.limit_value IS 'Numeric limit when limit_type=number; null when unlimited.';

-- =============================================================================
-- 3. SUBSCRIPTIONS: add subscription_plan_id
-- =============================================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

CREATE INDEX idx_subscriptions_plan ON public.subscriptions(subscription_plan_id);

COMMENT ON COLUMN public.subscriptions.plan IS 'Plan slug (free|pro|business) for quick lookups; mirrors subscription_plan_id.';
COMMENT ON COLUMN public.subscriptions.subscription_plan_id IS 'FK to subscription_plans; source of truth for plan features.';

-- =============================================================================
-- 4. SUBSCRIPTION PAYMENTS (SaaS billing; separate from invoice_payments)
-- =============================================================================
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  paid_at timestamptz,
  provider_reference text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscription_payments of own businesses"
  ON public.subscription_payments FOR SELECT
  USING (
    subscription_id IN (
      SELECT s.id FROM public.subscriptions s
      JOIN public.businesses b ON b.id = s.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage subscription_payments"
  ON public.subscription_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.subscription_payments IS 'Payments for SaaS subscription billing (Pro/Business). Separate from invoice_payments.';

-- =============================================================================
-- 5. UPDATED_AT TRIGGER for new tables
-- =============================================================================
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- 6. SEED: Free, Pro, Business plans and their features
-- =============================================================================
INSERT INTO public.subscription_plans (slug, name, description, price_amount, price_currency, billing_interval, is_contact_sales, sort_order)
VALUES
  ('free', 'Free Plan', 'Get started with essential invoicing', 0, 'USD', 'monthly', false, 1),
  ('pro', 'Pro Plan', 'For growing businesses with more volume', 19.99, 'USD', 'monthly', false, 2),
  ('business', 'Business Plan', 'Custom solution for your needs', null, 'USD', null, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Pro fixed price: set after you decide (e.g. 19.99)
-- UPDATE public.subscription_plans SET price_amount = 19.99, billing_interval = 'monthly' WHERE slug = 'pro';

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'number', 5
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'number', 1
  FROM public.subscription_plans WHERE slug = 'free'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'number', 50
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'invoices_per_month', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'businesses_count', 'unlimited', null
  FROM public.subscription_plans WHERE slug = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO NOTHING;
