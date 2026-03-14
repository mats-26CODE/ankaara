-- Subscriptions per user (profile), not per business.
-- One subscription per user; limits (invoices_per_month, businesses_count) apply across all their businesses.

-- =============================================================================
-- 1. Add user_id to subscriptions
-- =============================================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- 2. Backfill user_id from business owner
-- =============================================================================
UPDATE public.subscriptions s
SET user_id = b.owner_id
FROM public.businesses b
WHERE b.id = s.business_id
  AND s.user_id IS NULL;

-- =============================================================================
-- 3. Drop RLS policies (depend on business_id)
-- =============================================================================
DROP POLICY IF EXISTS "Users can CRUD subscriptions of own businesses" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view subscription_payments of own businesses" ON public.subscription_payments;

-- =============================================================================
-- 4. Drop business_id FK and column
-- =============================================================================
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_business_id_fkey;
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS business_id;

-- =============================================================================
-- 5. Enforce one subscription per user (remove rows that could not be backfilled)
-- =============================================================================
DELETE FROM public.subscriptions WHERE user_id IS NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

-- Drop old index if it existed (e.g. idx_subscriptions_business or idx_subscriptions_plan only)
-- Keep idx_subscriptions_plan for subscription_plan_id.

-- =============================================================================
-- 6. New RLS: subscriptions by user_id
-- =============================================================================
CREATE POLICY "Users can CRUD own subscription"
  ON public.subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 7. subscription_payments: allow by user via subscription
-- =============================================================================
CREATE POLICY "Users can view own subscription_payments"
  ON public.subscription_payments
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. handle_new_user: create subscription with user_id (no business_id)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  stat_id uuid;
  stat_total_users integer;
  business_id_var uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.statistics) THEN
    INSERT INTO public.statistics DEFAULT VALUES;
  END IF;

  IF NEW.raw_app_meta_data->>'provider' = 'phone' THEN
    INSERT INTO public.profiles(id, phone_number, auth_type)
    VALUES (NEW.id, NEW.phone, 'Phone');

    SELECT id, total_users INTO stat_id, stat_total_users
    FROM public.statistics
    ORDER BY created_at
    LIMIT 1;

    IF stat_total_users >= 0 THEN
      UPDATE public.statistics
      SET total_users = stat_total_users + 1
      WHERE id = stat_id;
    END IF;

  ELSIF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    INSERT INTO public.profiles(id, email, image_url, auth_type)
    VALUES (NEW.id, NEW.email,
            jsonb_build_object('id', 'google_avatar', 'imageUrl', NEW.raw_user_meta_data->>'avatar_url'),
            'Google');

    SELECT id, total_users INTO stat_id, stat_total_users
    FROM public.statistics
    ORDER BY created_at
    LIMIT 1;

    IF stat_total_users >= 0 THEN
      UPDATE public.statistics
      SET total_users = stat_total_users + 1
      WHERE id = stat_id;
    END IF;
  END IF;

  IF NEW.raw_app_meta_data->>'provider' IN ('phone', 'google') THEN
    INSERT INTO public.businesses (owner_id, name, currency)
    VALUES (NEW.id, 'My Business', 'TZS')
    RETURNING id INTO business_id_var;

    INSERT INTO public.subscriptions (user_id, plan, subscription_plan_id, status)
    SELECT NEW.id, 'free', sp.id, 'active'
    FROM public.subscription_plans sp
    WHERE sp.slug = 'free'
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON TABLE public.subscriptions IS 'One subscription per user (profile). Limits apply across all businesses owned by that user.';
