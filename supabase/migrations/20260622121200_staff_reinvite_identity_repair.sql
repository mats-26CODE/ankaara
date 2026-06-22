-- Repair staff identity on re-invite/login: prevent owner bootstrap ("My Business") for staff.

CREATE OR REPLACE FUNCTION public.user_has_active_staff_membership(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_staff bs
    WHERE bs.user_id = p_user_id
      AND bs.status IN ('pending', 'active')
  );
$$;

CREATE OR REPLACE FUNCTION public.find_staff_user_id_by_phone(p_phone text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  INNER JOIN public.business_staff bs ON bs.user_id = p.id
  WHERE regexp_replace(COALESCE(p.phone, ''), '[^0-9]', '', 'g')
      = regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
    AND bs.status IN ('pending', 'active')
  ORDER BY bs.invited_at DESC NULLS LAST
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.remove_auto_created_owner_shell(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
BEGIN
  IF NOT public.user_has_active_staff_membership(p_user_id) THEN
    RETURN;
  END IF;

  SELECT b.id
  INTO v_business_id
  FROM public.businesses b
  WHERE b.owner_id = p_user_id
    AND b.name = 'My Business'
  ORDER BY b.created_at ASC
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.clients WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.products WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.sales WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.invoices WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.quotations WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.expenses WHERE business_id = v_business_id) THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.loans WHERE business_id = v_business_id) THEN RETURN; END IF;

  DELETE FROM public.businesses WHERE id = v_business_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.repair_staff_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_has_active_staff_membership(p_user_id) THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET account_type = 'staff'::public.account_type,
      onboarding_completed = true,
      is_active = true,
      updated_at = now()
  WHERE id = p_user_id;

  PERFORM public.remove_auto_created_owner_shell(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_pending_staff_membership()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.repair_staff_account(auth.uid());

  UPDATE public.business_staff
  SET status = 'active',
      joined_at = COALESCE(joined_at, now())
  WHERE user_id = auth.uid()
    AND status = 'pending';

  UPDATE public.profiles
  SET onboarding_completed = true
  WHERE id = auth.uid()
    AND account_type = 'staff'::public.account_type
    AND onboarding_completed = false;
END;
$$;

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
  v_is_staff boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.statistics) THEN
    INSERT INTO public.statistics DEFAULT VALUES;
  END IF;

  v_is_staff := (
    COALESCE(NEW.raw_app_meta_data->>'account_type', '') = 'staff'
    OR public.user_has_active_staff_membership(NEW.id)
  );

  IF v_is_staff THEN
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
      onboarding_completed,
      is_active
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
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE
    SET account_type = 'staff'::public.account_type,
        onboarding_completed = true,
        is_active = true,
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

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
    VALUES (NEW.id, NEW.phone, 'Phone', 'owner')
    ON CONFLICT (id) DO NOTHING;

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
    )
    ON CONFLICT (id) DO NOTHING;

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

  IF NEW.raw_app_meta_data->>'provider' IN ('phone', 'google')
     AND NOT public.user_has_active_staff_membership(NEW.id) THEN
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

REVOKE ALL ON FUNCTION public.user_has_active_staff_membership(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.find_staff_user_id_by_phone(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_auto_created_owner_shell(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.repair_staff_account(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.user_has_active_staff_membership(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_staff_user_id_by_phone(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_auto_created_owner_shell(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.repair_staff_account(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.repair_staff_account(uuid) IS
  'When a user has pending/active staff membership: force staff profile, skip owner onboarding, remove empty default My Business shell.';

COMMENT ON FUNCTION public.find_staff_user_id_by_phone(text) IS
  'Returns user id when phone matches a profile with pending/active staff membership (blocks mistaken owner signup).';
