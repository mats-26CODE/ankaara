-- Business plan: set fixed TZS pricing and disable contact-sales flow.

UPDATE public.subscription_plans
SET
  price_amount = 54000,
  price_currency = 'TZS',
  is_contact_sales = false,
  description = 'For teams and businesses with larger catalogues — unlimited everything.'
WHERE slug = 'business-monthly';

UPDATE public.subscription_plans
SET
  price_amount = 316000,
  price_currency = 'TZS',
  is_contact_sales = false,
  description = 'For teams and businesses — 6 month billing.'
WHERE slug = 'business-6month';

UPDATE public.subscription_plans
SET
  price_amount = 620000,
  price_currency = 'TZS',
  is_contact_sales = false,
  description = 'For teams and businesses — annual billing.'
WHERE slug = 'business-yearly';

COMMENT ON COLUMN public.subscription_plans.is_contact_sales IS
  'When true, plan has no fixed price and users are directed to contact sales.';
