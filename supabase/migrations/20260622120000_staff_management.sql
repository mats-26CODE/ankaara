-- Staff management: profiles extension, staff categories, business memberships,
-- authorization helpers, RLS updates, plan features, and handle_new_user staff branch.

-- =============================================================================
-- 1. PROFILE ACCOUNT TYPE
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE public.account_type AS ENUM ('owner', 'staff');
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

COMMENT ON COLUMN public.profiles.account_type IS 'owner = business account; staff = invited team member';
COMMENT ON COLUMN public.profiles.first_name IS 'Staff first name (optional for owners)';
COMMENT ON COLUMN public.profiles.last_name IS 'Staff last name (optional for owners)';

-- =============================================================================
-- 2. STAFF CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  permissions jsonb NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_categories_system_slug
  ON public.staff_categories(slug)
  WHERE business_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_categories_business_slug
  ON public.staff_categories(business_id, slug)
  WHERE business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_categories_business
  ON public.staff_categories(business_id);

ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. BUSINESS STAFF MEMBERSHIPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.business_staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_category_id uuid NOT NULL REFERENCES public.staff_categories(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  removed_at timestamptz,
  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_staff_business
  ON public.business_staff(business_id);

CREATE INDEX IF NOT EXISTS idx_business_staff_user
  ON public.business_staff(user_id);

CREATE INDEX IF NOT EXISTS idx_business_staff_status
  ON public.business_staff(business_id, status);

ALTER TABLE public.business_staff ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS staff_categories_updated_at ON public.staff_categories;
CREATE TRIGGER staff_categories_updated_at
  BEFORE UPDATE ON public.staff_categories
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- 4. SEED SYSTEM STAFF CATEGORIES
-- =============================================================================
INSERT INTO public.staff_categories (business_id, slug, name, permissions, is_system, sort_order)
SELECT NULL, 'salesperson', 'Salesperson',
  '{
    "dashboard": {"view": false},
    "profits": {"view": false},
    "reports": {"view": false},
    "sales": {"view": true, "create": true, "edit": true},
    "inventory": {"view": true, "create": true, "edit": true},
    "clients": {"view": true, "create": true, "edit": true},
    "expenses": {"view": true, "create": true, "edit": true},
    "loans": {"view": true, "create": true, "edit": true},
    "invoices": {"view": false, "create": false, "edit": false},
    "quotations": {"view": false, "create": false, "edit": false},
    "business_settings": {"view": false, "edit": false, "create": false},
    "staff_management": {"view": false, "manage": false}
  }'::jsonb,
  true, 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_categories WHERE business_id IS NULL AND slug = 'salesperson'
);

INSERT INTO public.staff_categories (business_id, slug, name, permissions, is_system, sort_order)
SELECT NULL, 'accountant', 'Accountant',
  '{
    "dashboard": {"view": false},
    "profits": {"view": false},
    "reports": {"view": true},
    "sales": {"view": true, "create": false, "edit": false},
    "inventory": {"view": true, "create": false, "edit": false},
    "clients": {"view": true, "create": false, "edit": false},
    "expenses": {"view": true, "create": true, "edit": true},
    "loans": {"view": true, "create": false, "edit": false},
    "invoices": {"view": true, "create": true, "edit": true},
    "quotations": {"view": true, "create": true, "edit": true},
    "business_settings": {"view": false, "edit": false, "create": false},
    "staff_management": {"view": false, "manage": false}
  }'::jsonb,
  true, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_categories WHERE business_id IS NULL AND slug = 'accountant'
);

INSERT INTO public.staff_categories (business_id, slug, name, permissions, is_system, sort_order)
SELECT NULL, 'manager', 'Manager',
  '{
    "dashboard": {"view": true},
    "profits": {"view": true},
    "reports": {"view": true},
    "sales": {"view": true, "create": true, "edit": true},
    "inventory": {"view": true, "create": true, "edit": true},
    "clients": {"view": true, "create": true, "edit": true},
    "expenses": {"view": true, "create": true, "edit": true},
    "loans": {"view": true, "create": true, "edit": true},
    "invoices": {"view": true, "create": true, "edit": true},
    "quotations": {"view": true, "create": true, "edit": true},
    "business_settings": {"view": true, "edit": true, "create": true},
    "staff_management": {"view": true, "manage": true}
  }'::jsonb,
  true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_categories WHERE business_id IS NULL AND slug = 'manager'
);

-- =============================================================================
-- 5. PLAN FEATURES: staff_management + staff_count
-- =============================================================================
INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'staff_management', 'unlimited', NULL
FROM public.subscription_plans
WHERE plan_tier IN ('pro', 'business')
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type,
      limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'staff_count', 'number', 5
FROM public.subscription_plans
WHERE plan_tier = 'pro'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type,
      limit_value = EXCLUDED.limit_value;

INSERT INTO public.subscription_plan_features (subscription_plan_id, feature_key, limit_type, limit_value)
SELECT id, 'staff_count', 'unlimited', NULL
FROM public.subscription_plans
WHERE plan_tier = 'business'
ON CONFLICT (subscription_plan_id, feature_key) DO UPDATE
  SET limit_type = EXCLUDED.limit_type,
      limit_value = EXCLUDED.limit_value;

-- =============================================================================
-- 6. AUTHORIZATION HELPERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_business_owner_id(p_business_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.owner_id
  FROM public.businesses b
  WHERE b.id = p_business_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accessible_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id
  FROM public.businesses b
  WHERE b.owner_id = auth.uid()
  UNION
  SELECT bs.business_id
  FROM public.business_staff bs
  WHERE bs.user_id = auth.uid()
    AND bs.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.get_effective_permissions(p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms jsonb;
BEGIN
  IF public.is_business_owner(p_business_id) THEN
    RETURN jsonb_build_object('is_owner', true);
  END IF;

  SELECT sc.permissions INTO v_perms
  FROM public.business_staff bs
  JOIN public.staff_categories sc ON sc.id = bs.staff_category_id
  WHERE bs.business_id = p_business_id
    AND bs.user_id = auth.uid()
    AND bs.status = 'active'
  LIMIT 1;

  RETURN COALESCE(v_perms, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_can(
  p_business_id uuid,
  p_resource text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perms jsonb;
BEGIN
  IF p_business_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_business_owner(p_business_id) THEN
    RETURN true;
  END IF;

  SELECT sc.permissions INTO v_perms
  FROM public.business_staff bs
  JOIN public.staff_categories sc ON sc.id = bs.staff_category_id
  WHERE bs.business_id = p_business_id
    AND bs.user_id = auth.uid()
    AND bs.status = 'active'
  LIMIT 1;

  IF v_perms IS NULL THEN
    RETURN false;
  END IF;

  RETURN COALESCE((v_perms -> p_resource ->> p_action)::boolean, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.require_business_permission(
  p_business_id uuid,
  p_resource text,
  p_action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.staff_can(p_business_id, p_resource, p_action) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_pending_staff_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.business_staff
  SET status = 'active',
      joined_at = COALESCE(joined_at, now())
  WHERE user_id = auth.uid()
    AND status = 'pending';

  UPDATE public.profiles
  SET onboarding_completed = true
  WHERE id = auth.uid()
    AND account_type = 'staff'
    AND onboarding_completed = false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_business_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_owner_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.accessible_business_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_effective_permissions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_can(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.require_business_permission(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.activate_pending_staff_membership() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_owner_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accessible_business_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_can(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.require_business_permission(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_pending_staff_membership() TO authenticated;

-- =============================================================================
-- 7. EXTEND check_plan_limit FOR staff_count
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_user_id uuid,
  p_feature_key text,
  p_context jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_plan_id uuid;
  v_limit_type text;
  v_limit_value numeric;
  v_current_usage bigint;
  v_business_id uuid;
BEGIN
  SELECT s.subscription_plan_id INTO v_plan_id
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND (s.status IS NULL OR s.status = 'active')
    AND (s.end_date IS NULL OR s.end_date >= now())
  ORDER BY s.start_date DESC NULLS LAST
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE slug = 'free'
    LIMIT 1;
  END IF;

  IF v_plan_id IS NULL THEN
    RETURN;
  END IF;

  SELECT f.limit_type, f.limit_value INTO v_limit_type, v_limit_value
  FROM public.subscription_plan_features f
  WHERE f.subscription_plan_id = v_plan_id
    AND f.feature_key = p_feature_key
  LIMIT 1;

  IF v_limit_type IS NULL OR v_limit_type = 'unlimited' THEN
    RETURN;
  END IF;

  IF v_limit_value IS NULL THEN
    RETURN;
  END IF;

  IF p_feature_key = 'invoices_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.invoices i
    INNER JOIN public.businesses b ON b.id = i.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', i.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'quotations_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.quotations q
    INNER JOIN public.businesses b ON b.id = q.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', q.created_at) = date_trunc('month', now());
  ELSIF p_feature_key = 'sales_per_month' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.sales s
    INNER JOIN public.businesses b ON b.id = s.business_id AND b.owner_id = p_user_id
    WHERE date_trunc('month', s.sale_date) = date_trunc('month', now());
  ELSIF p_feature_key = 'businesses_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.businesses
    WHERE owner_id = p_user_id;
  ELSIF p_feature_key = 'clients_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.clients
    WHERE business_id = v_business_id
      AND is_walk_in = false;
  ELSIF p_feature_key = 'products_per_business' THEN
    v_business_id := (p_context->>'business_id')::uuid;
    IF v_business_id IS NULL THEN
      RETURN;
    END IF;
    SELECT count(*) INTO v_current_usage
    FROM public.products
    WHERE business_id = v_business_id;
  ELSIF p_feature_key = 'staff_count' THEN
    SELECT count(*) INTO v_current_usage
    FROM public.business_staff bs
    INNER JOIN public.businesses b ON b.id = bs.business_id
    WHERE b.owner_id = p_user_id
      AND bs.status IN ('pending', 'active');
  ELSE
    RETURN;
  END IF;

  IF v_current_usage >= v_limit_value THEN
    RAISE EXCEPTION 'PLAN_LIMIT:%', p_feature_key;
  END IF;

  RETURN;
END;
$function$;

-- =============================================================================
-- 8. handle_new_user: staff branch (no default business/subscription)
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
  v_full_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.statistics) THEN
    INSERT INTO public.statistics DEFAULT VALUES;
  END IF;

  IF COALESCE(NEW.raw_app_meta_data->>'account_type', '') = 'staff' THEN
    v_full_name := NULLIF(
      BTRIM(
        COALESCE(NEW.raw_app_meta_data->>'first_name', '') || ' ' ||
        COALESCE(NEW.raw_app_meta_data->>'last_name', '')
      ),
      ''
    );

    INSERT INTO public.profiles(
      id,
      phone,
      email,
      auth_type,
      account_type,
      first_name,
      last_name,
      full_name,
      onboarding_completed
    )
    VALUES (
      NEW.id,
      NEW.phone,
      NEW.email,
      CASE
        WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'Google'::public.auth_type
        ELSE 'Phone'::public.auth_type
      END,
      'staff'::public.account_type,
      NULLIF(NEW.raw_app_meta_data->>'first_name', ''),
      NULLIF(NEW.raw_app_meta_data->>'last_name', ''),
      v_full_name,
      v_full_name IS NOT NULL
    );

    SELECT id, total_users INTO stat_id, stat_total_users
    FROM public.statistics
    ORDER BY created_at
    LIMIT 1;

    IF stat_total_users >= 0 THEN
      UPDATE public.statistics
      SET total_users = stat_total_users + 1
      WHERE id = stat_id;
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.raw_app_meta_data->>'provider' = 'phone' THEN
    INSERT INTO public.profiles(id, phone, auth_type, account_type)
    VALUES (NEW.id, NEW.phone, 'Phone', 'owner');

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
    INSERT INTO public.profiles(id, email, image_url, auth_type, account_type)
    VALUES (
      NEW.id,
      NEW.email,
      jsonb_build_object('id', 'google_avatar', 'imageUrl', NEW.raw_user_meta_data->>'avatar_url'),
      'Google',
      'owner'
    );

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

-- =============================================================================
-- 9. STAFF / CATEGORY RLS
-- =============================================================================
DROP POLICY IF EXISTS "Read staff categories" ON public.staff_categories;
CREATE POLICY "Read staff categories"
  ON public.staff_categories FOR SELECT
  TO authenticated
  USING (
    business_id IS NULL
    OR public.is_business_owner(business_id)
    OR business_id IN (SELECT public.accessible_business_ids())
  );

DROP POLICY IF EXISTS "Owners manage business staff categories" ON public.staff_categories;
CREATE POLICY "Owners manage business staff categories"
  ON public.staff_categories FOR ALL
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND public.is_business_owner(business_id)
    AND public.staff_can(business_id, 'staff_management', 'manage')
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND public.is_business_owner(business_id)
    AND public.staff_can(business_id, 'staff_management', 'manage')
  );

DROP POLICY IF EXISTS "Owners select business staff" ON public.business_staff;
DROP POLICY IF EXISTS "Owners insert business staff" ON public.business_staff;
DROP POLICY IF EXISTS "Owners update business staff" ON public.business_staff;
DROP POLICY IF EXISTS "Staff read own membership" ON public.business_staff;

CREATE POLICY "Read business staff"
  ON public.business_staff FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_business_owner(business_id)
  );

CREATE POLICY "Owners insert business staff"
  ON public.business_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_business_owner(business_id)
    AND public.staff_can(business_id, 'staff_management', 'manage')
  );

CREATE POLICY "Owners update business staff"
  ON public.business_staff FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY "Owners delete business staff"
  ON public.business_staff FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- =============================================================================
-- 10. BUSINESSES RLS (split owner CRUD vs staff read)
-- =============================================================================
DROP POLICY IF EXISTS "Users can CRUD own businesses" ON public.businesses;

CREATE POLICY "Users can view accessible businesses"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.accessible_business_ids()));

CREATE POLICY "Owners can insert businesses"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own businesses"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own businesses"
  ON public.businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =============================================================================
-- 11. BUSINESS-SCOPED TABLE RLS
-- =============================================================================
DROP POLICY IF EXISTS "Users can CRUD clients of own businesses" ON public.clients;
CREATE POLICY "Users can select clients of accessible businesses"
  ON public.clients FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'clients', 'view'));
CREATE POLICY "Users can insert clients of accessible businesses"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'clients', 'create'));
CREATE POLICY "Users can update clients of accessible businesses"
  ON public.clients FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'clients', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'clients', 'edit'));
CREATE POLICY "Users can delete clients of accessible businesses"
  ON public.clients FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'clients', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD products of own businesses" ON public.products;
CREATE POLICY "Users can select products of accessible businesses"
  ON public.products FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'view'));
CREATE POLICY "Users can insert products of accessible businesses"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'inventory', 'create'));
CREATE POLICY "Users can update products of accessible businesses"
  ON public.products FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'inventory', 'edit'));
CREATE POLICY "Users can delete products of accessible businesses"
  ON public.products FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD sales of own businesses" ON public.sales;
CREATE POLICY "Users can select sales of accessible businesses"
  ON public.sales FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'sales', 'view'));
CREATE POLICY "Users can insert sales of accessible businesses"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'sales', 'create'));
CREATE POLICY "Users can update sales of accessible businesses"
  ON public.sales FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'sales', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'sales', 'edit'));
CREATE POLICY "Users can delete sales of accessible businesses"
  ON public.sales FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'sales', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD items of own sales" ON public.sale_items;
CREATE POLICY "Users can select sale items of accessible businesses"
  ON public.sale_items FOR SELECT TO authenticated
  USING (
    sale_id IN (
      SELECT s.id FROM public.sales s
      WHERE public.staff_can(s.business_id, 'sales', 'view')
    )
  );
CREATE POLICY "Users can insert sale items of accessible businesses"
  ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (
    sale_id IN (
      SELECT s.id FROM public.sales s
      WHERE public.staff_can(s.business_id, 'sales', 'create')
    )
  );
CREATE POLICY "Users can update sale items of accessible businesses"
  ON public.sale_items FOR UPDATE TO authenticated
  USING (
    sale_id IN (
      SELECT s.id FROM public.sales s
      WHERE public.staff_can(s.business_id, 'sales', 'edit')
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT s.id FROM public.sales s
      WHERE public.staff_can(s.business_id, 'sales', 'edit')
    )
  );
CREATE POLICY "Users can delete sale items of accessible businesses"
  ON public.sale_items FOR DELETE TO authenticated
  USING (
    sale_id IN (
      SELECT s.id FROM public.sales s
      WHERE public.staff_can(s.business_id, 'sales', 'edit')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD inventory movements of own businesses" ON public.inventory_movements;
CREATE POLICY "Users can select inventory movements of accessible businesses"
  ON public.inventory_movements FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'view'));
CREATE POLICY "Users can insert inventory movements of accessible businesses"
  ON public.inventory_movements FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'inventory', 'edit'));
CREATE POLICY "Users can update inventory movements of accessible businesses"
  ON public.inventory_movements FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'inventory', 'edit'));
CREATE POLICY "Users can delete inventory movements of accessible businesses"
  ON public.inventory_movements FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'inventory', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD expenses of own businesses" ON public.expenses;
CREATE POLICY "Users can select expenses of accessible businesses"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'expenses', 'view'));
CREATE POLICY "Users can insert expenses of accessible businesses"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'expenses', 'create'));
CREATE POLICY "Users can update expenses of accessible businesses"
  ON public.expenses FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'expenses', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'expenses', 'edit'));
CREATE POLICY "Users can delete expenses of accessible businesses"
  ON public.expenses FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'expenses', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD loans of own businesses" ON public.loans;
CREATE POLICY "Users can select loans of accessible businesses"
  ON public.loans FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'loans', 'view'));
CREATE POLICY "Users can insert loans of accessible businesses"
  ON public.loans FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'loans', 'create'));
CREATE POLICY "Users can update loans of accessible businesses"
  ON public.loans FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'loans', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'loans', 'edit'));
CREATE POLICY "Users can delete loans of accessible businesses"
  ON public.loans FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'loans', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD loan items of own loans" ON public.loan_items;
CREATE POLICY "Users can select loan items of accessible businesses"
  ON public.loan_items FOR SELECT TO authenticated
  USING (
    loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE public.staff_can(l.business_id, 'loans', 'view')
    )
  );
CREATE POLICY "Users can insert loan items of accessible businesses"
  ON public.loan_items FOR INSERT TO authenticated
  WITH CHECK (
    loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE public.staff_can(l.business_id, 'loans', 'create')
    )
  );
CREATE POLICY "Users can update loan items of accessible businesses"
  ON public.loan_items FOR UPDATE TO authenticated
  USING (
    loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE public.staff_can(l.business_id, 'loans', 'edit')
    )
  )
  WITH CHECK (
    loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE public.staff_can(l.business_id, 'loans', 'edit')
    )
  );
CREATE POLICY "Users can delete loan items of accessible businesses"
  ON public.loan_items FOR DELETE TO authenticated
  USING (
    loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE public.staff_can(l.business_id, 'loans', 'edit')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD loan payments of own businesses" ON public.loan_payments;
CREATE POLICY "Users can select loan payments of accessible businesses"
  ON public.loan_payments FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'loans', 'view'));
CREATE POLICY "Users can insert loan payments of accessible businesses"
  ON public.loan_payments FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'loans', 'create'));
CREATE POLICY "Users can update loan payments of accessible businesses"
  ON public.loan_payments FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'loans', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'loans', 'edit'));
CREATE POLICY "Users can delete loan payments of accessible businesses"
  ON public.loan_payments FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'loans', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD invoices of own businesses" ON public.invoices;
CREATE POLICY "Users can select invoices of accessible businesses"
  ON public.invoices FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'view'));
CREATE POLICY "Users can insert invoices of accessible businesses"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'invoices', 'create'));
CREATE POLICY "Users can update invoices of accessible businesses"
  ON public.invoices FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'invoices', 'edit'));
CREATE POLICY "Users can delete invoices of accessible businesses"
  ON public.invoices FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD items of own invoices" ON public.invoice_items;
CREATE POLICY "Users can select invoice items of accessible businesses"
  ON public.invoice_items FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'view')
    )
  );
CREATE POLICY "Users can insert invoice items of accessible businesses"
  ON public.invoice_items FOR INSERT TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'create')
    )
  );
CREATE POLICY "Users can update invoice items of accessible businesses"
  ON public.invoice_items FOR UPDATE TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'edit')
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'edit')
    )
  );
CREATE POLICY "Users can delete invoice items of accessible businesses"
  ON public.invoice_items FOR DELETE TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'edit')
    )
  );

DROP POLICY IF EXISTS "Users can view invoice_payments of own invoices" ON public.invoice_payments;
CREATE POLICY "Users can view invoice_payments of accessible businesses"
  ON public.invoice_payments FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'view')
    )
  );

DROP POLICY IF EXISTS "Users can view invoice_payment_transactions of own invoice payments" ON public.invoice_payment_transactions;
CREATE POLICY "Users can view invoice_payment_transactions of accessible businesses"
  ON public.invoice_payment_transactions FOR SELECT TO authenticated
  USING (
    invoice_payment_id IN (
      SELECT p.id FROM public.invoice_payments p
      JOIN public.invoices i ON i.id = p.invoice_id
      WHERE public.staff_can(i.business_id, 'invoices', 'view')
    )
  );

DROP POLICY IF EXISTS "Users can view invoice_views of own invoices" ON public.invoice_views;
CREATE POLICY "Users can view invoice_views of accessible businesses"
  ON public.invoice_views FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      WHERE public.staff_can(i.business_id, 'invoices', 'view')
    )
  );

DROP POLICY IF EXISTS "Users can CRUD templates of own businesses" ON public.invoice_templates;
CREATE POLICY "Users can select invoice templates of accessible businesses"
  ON public.invoice_templates FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'view'));
CREATE POLICY "Users can insert invoice templates of accessible businesses"
  ON public.invoice_templates FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'invoices', 'edit'));
CREATE POLICY "Users can update invoice templates of accessible businesses"
  ON public.invoice_templates FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'invoices', 'edit'));
CREATE POLICY "Users can delete invoice templates of accessible businesses"
  ON public.invoice_templates FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'invoices', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD quotations of own businesses" ON public.quotations;
CREATE POLICY "Users can select quotations of accessible businesses"
  ON public.quotations FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'quotations', 'view'));
CREATE POLICY "Users can insert quotations of accessible businesses"
  ON public.quotations FOR INSERT TO authenticated
  WITH CHECK (public.staff_can(business_id, 'quotations', 'create'));
CREATE POLICY "Users can update quotations of accessible businesses"
  ON public.quotations FOR UPDATE TO authenticated
  USING (public.staff_can(business_id, 'quotations', 'edit'))
  WITH CHECK (public.staff_can(business_id, 'quotations', 'edit'));
CREATE POLICY "Users can delete quotations of accessible businesses"
  ON public.quotations FOR DELETE TO authenticated
  USING (public.staff_can(business_id, 'quotations', 'edit'));

DROP POLICY IF EXISTS "Users can CRUD items of own quotations" ON public.quotation_items;
CREATE POLICY "Users can select quotation items of accessible businesses"
  ON public.quotation_items FOR SELECT TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'view')
    )
  );
CREATE POLICY "Users can insert quotation items of accessible businesses"
  ON public.quotation_items FOR INSERT TO authenticated
  WITH CHECK (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'create')
    )
  );
CREATE POLICY "Users can update quotation items of accessible businesses"
  ON public.quotation_items FOR UPDATE TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'edit')
    )
  )
  WITH CHECK (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'edit')
    )
  );
CREATE POLICY "Users can delete quotation items of accessible businesses"
  ON public.quotation_items FOR DELETE TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'edit')
    )
  );

DROP POLICY IF EXISTS "Users can view quotation_views of own quotations" ON public.quotation_views;
CREATE POLICY "Users can view quotation_views of accessible businesses"
  ON public.quotation_views FOR SELECT TO authenticated
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      WHERE public.staff_can(q.business_id, 'quotations', 'view')
    )
  );

DROP POLICY IF EXISTS "Users can read expense categories for own businesses" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert expense categories for own businesses" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update expense categories for own businesses" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete expense categories for own businesses" ON public.expense_categories;

CREATE POLICY "Users can read expense categories for accessible businesses"
  ON public.expense_categories FOR SELECT TO authenticated
  USING (
    business_id IS NULL
    OR public.staff_can(business_id, 'expenses', 'view')
  );
CREATE POLICY "Users can insert expense categories for accessible businesses"
  ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.staff_can(business_id, 'expenses', 'edit')
  );
CREATE POLICY "Users can update expense categories for accessible businesses"
  ON public.expense_categories FOR UPDATE TO authenticated
  USING (
    business_id IS NOT NULL
    AND public.staff_can(business_id, 'expenses', 'edit')
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND public.staff_can(business_id, 'expenses', 'edit')
  );
CREATE POLICY "Users can delete expense categories for accessible businesses"
  ON public.expense_categories FOR DELETE TO authenticated
  USING (
    business_id IS NOT NULL
    AND public.staff_can(business_id, 'expenses', 'edit')
  );

-- =============================================================================
-- 12. RPC AUTHORIZATION UPDATES
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_product_sales_performance(
  p_business_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  units_sold numeric,
  revenue numeric,
  cogs numeric,
  profit numeric,
  sale_count bigint,
  is_orphan_line boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id uuid;
BEGIN
  IF p_business_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT public.staff_can(p_business_id, 'reports', 'view') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_owner_id := public.get_business_owner_id(p_business_id);
  PERFORM public.require_plan_feature(v_owner_id, 'product_sales_reports');

  RETURN QUERY
  SELECT
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ) AS product_name,
    p.sku,
    COALESCE(SUM(si.quantity), 0)::numeric AS units_sold,
    COALESCE(SUM(si.total), 0)::numeric AS revenue,
    COALESCE(SUM(si.cost_total), 0)::numeric AS cogs,
    COALESCE(SUM(si.profit), 0)::numeric AS profit,
    COUNT(DISTINCT si.sale_id)::bigint AS sale_count,
    (si.product_id IS NULL) AS is_orphan_line
  FROM public.sale_items si
  INNER JOIN public.sales s ON s.id = si.sale_id
  LEFT JOIN public.products p ON p.id = si.product_id
  WHERE s.business_id = p_business_id
    AND si.item_type = 'product'
    AND (p_from_date IS NULL OR s.sale_date >= p_from_date)
    AND (p_to_date IS NULL OR s.sale_date <= p_to_date)
  GROUP BY
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ),
    p.sku
  ORDER BY revenue DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_product_sales_performance(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_product_sales_performance(uuid, date, date) TO authenticated;

-- Patch SECURITY DEFINER RPCs to honor staff permissions (owners still pass via staff_can).
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id uuid,
  p_quantity_delta numeric,
  p_movement_type text DEFAULT 'adjustment',
  p_reason text DEFAULT NULL,
  p_unit_cost numeric DEFAULT NULL
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_after numeric(14,4);
  v_movement public.inventory_movements%ROWTYPE;
BEGIN
  IF p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'Quantity change must not be zero';
  END IF;

  IF p_movement_type NOT IN ('initial', 'adjustment', 'restock', 'rollback') THEN
    RAISE EXCEPTION 'Invalid stock movement type';
  END IF;

  SELECT p.* INTO v_product
  FROM public.products p
  WHERE p.id = p_product_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  PERFORM public.require_business_permission(v_product.business_id, 'inventory', 'edit');

  IF v_product.item_type <> 'product' THEN
    RAISE EXCEPTION 'Services do not track stock';
  END IF;

  v_after := v_product.stock_quantity + p_quantity_delta;
  IF v_after < 0 THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  UPDATE public.products
  SET stock_quantity = v_after,
      updated_at = now()
  WHERE id = v_product.id;

  INSERT INTO public.inventory_movements (
    business_id,
    product_id,
    movement_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    unit_cost,
    reason
  )
  VALUES (
    v_product.business_id,
    v_product.id,
    p_movement_type,
    p_quantity_delta,
    v_product.stock_quantity,
    v_after,
    p_unit_cost,
    p_reason
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;
