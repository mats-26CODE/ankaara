-- Allow managers to update staff status; sync profiles.is_active with membership state.

DROP POLICY IF EXISTS "Owners update business staff" ON public.business_staff;

CREATE POLICY "Managers update business staff"
  ON public.business_staff FOR UPDATE
  TO authenticated
  USING (
    public.is_business_owner(business_id)
    OR public.staff_can(business_id, 'staff_management', 'manage')
  )
  WITH CHECK (
    public.is_business_owner(business_id)
    OR public.staff_can(business_id, 'staff_management', 'manage')
  );

CREATE OR REPLACE FUNCTION public.sync_staff_profile_active(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active_membership boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.business_staff bs
    WHERE bs.user_id = p_user_id
      AND bs.status IN ('pending', 'active')
  ) INTO v_has_active_membership;

  UPDATE public.profiles
  SET is_active = v_has_active_membership,
      updated_at = now()
  WHERE id = p_user_id
    AND account_type = 'staff'::public.account_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_business_staff_status(
  p_staff_id uuid,
  p_business_id uuid,
  p_status text
)
RETURNS public.business_staff
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.business_staff;
BEGIN
  IF p_status NOT IN ('pending', 'active', 'suspended', 'removed') THEN
    RAISE EXCEPTION 'Invalid staff status';
  END IF;

  IF NOT (
    public.is_business_owner(p_business_id)
    OR public.staff_can(p_business_id, 'staff_management', 'manage')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.business_staff bs
  SET status = p_status,
      removed_at = CASE
        WHEN p_status = 'removed' THEN COALESCE(bs.removed_at, now())
        WHEN p_status = 'active' THEN NULL
        ELSE bs.removed_at
      END,
      joined_at = CASE
        WHEN p_status = 'active' THEN COALESCE(bs.joined_at, now())
        ELSE bs.joined_at
      END
  WHERE bs.id = p_staff_id
    AND bs.business_id = p_business_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found';
  END IF;

  PERFORM public.sync_staff_profile_active(v_row.user_id);

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.update_business_staff_status(uuid, uuid, text) IS
  'Suspend, reactivate, or remove a staff member; keeps profiles.is_active in sync.';

COMMENT ON FUNCTION public.sync_staff_profile_active(uuid) IS
  'Sets profiles.is_active from pending/active business_staff memberships for staff accounts.';

CREATE OR REPLACE FUNCTION public.staff_user_can_authenticate(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (
      SELECT account_type FROM public.profiles WHERE id = p_user_id
    ) = 'owner'::public.account_type THEN true
    WHEN COALESCE((
      SELECT is_active FROM public.profiles WHERE id = p_user_id
    ), false) = false THEN false
    WHEN EXISTS (
      SELECT 1
      FROM public.business_staff bs
      WHERE bs.user_id = p_user_id
        AND bs.status IN ('pending', 'active')
    ) THEN true
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.sync_staff_profile_active(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_business_staff_status(uuid, uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.sync_staff_profile_active(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_business_staff_status(uuid, uuid, text) TO authenticated, service_role;
