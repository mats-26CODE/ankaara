-- Account deletion v2: also remove the owner's profile row and any staff
-- accounts that belonged ONLY to the deleted owner's businesses.
--
-- Why this is needed:
--   * public.profiles has NO foreign key to auth.users, so deleting the auth
--     user does not cascade-delete the profile row (it was left orphaned).
--   * Staff are separate auth users + profiles (account_type = 'staff'); the
--     previous version only deleted their business_staff membership rows, so
--     their auth users and profiles survived.
--
-- The function now returns the set of auth user IDs whose profiles it deleted
-- (the owner + any orphaned staff). The delete-account edge function deletes
-- those auth.users rows (and their storage) via the admin API afterwards.
--
-- Called only by the `delete-account` edge function via the service role.

DROP FUNCTION IF EXISTS public.delete_user_account_data(uuid);

CREATE OR REPLACE FUNCTION public.delete_user_account_data(p_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_biz uuid;
  v_owned uuid[];
  v_staff uuid[];
  v_deleted uuid[] := ARRAY[]::uuid[];
  v_staff_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  -- Businesses owned by this user.
  SELECT array_agg(id) INTO v_owned
    FROM public.businesses
   WHERE owner_id = p_user_id;

  -- Staff accounts attached to those businesses (candidates for removal).
  IF v_owned IS NOT NULL THEN
    SELECT array_agg(DISTINCT bs.user_id) INTO v_staff
      FROM public.business_staff bs
     WHERE bs.business_id = ANY(v_owned)
       AND bs.user_id IS NOT NULL
       AND bs.user_id <> p_user_id;
  END IF;

  -- 1. Reassign RESTRICT references the user holds in businesses they do NOT
  --    own (e.g. acting as a manager) to that business owner, so deleting the
  --    user's profile later is not blocked.
  UPDATE public.sale_item_returns r
     SET authorized_by = b.owner_id
    FROM public.businesses b
   WHERE r.business_id = b.id
     AND r.authorized_by = p_user_id
     AND b.owner_id <> p_user_id;

  UPDATE public.business_staff s
     SET invited_by = b.owner_id
    FROM public.businesses b
   WHERE s.business_id = b.id
     AND s.invited_by = p_user_id
     AND b.owner_id <> p_user_id;

  -- 2. Delete every business owned by the user. Children that RESTRICT the
  --    business cascade (invoices / loans / quotations -> clients, and staff
  --    rows -> staff_categories / profiles) are removed explicitly first.
  IF v_owned IS NOT NULL THEN
    FOREACH v_biz IN ARRAY v_owned
    LOOP
      DELETE FROM public.invoices       WHERE business_id = v_biz; -- cascades invoice_items, payments, payment_transactions, invoice_views
      DELETE FROM public.quotations     WHERE business_id = v_biz; -- cascades quotation_items, quotation_views
      DELETE FROM public.loans          WHERE business_id = v_biz; -- cascades loan_items, loan_payments
      DELETE FROM public.business_staff WHERE business_id = v_biz; -- clears invited_by / staff_category_id RESTRICT
      DELETE FROM public.businesses     WHERE id = v_biz;          -- cascades clients, products, sales, expenses, etc.
    END LOOP;
  END IF;

  -- 3. Per-user rows that are not removed by a business cascade.
  DELETE FROM public.subscriptions    WHERE user_id = p_user_id; -- cascades subscription_payments
  DELETE FROM public.otp_verification WHERE user_id = p_user_id;

  -- 4. Memberships where the user is staff of someone else's business.
  DELETE FROM public.business_staff   WHERE user_id = p_user_id;

  -- 5. Delete the owner's profile (no auth.users FK cascade exists).
  DELETE FROM public.profiles WHERE id = p_user_id;
  v_deleted := array_append(v_deleted, p_user_id);

  -- 6. Remove staff accounts that no longer belong to ANY business (i.e. they
  --    only ever belonged to the deleted owner). Staff who also work for other
  --    businesses keep their account.
  IF v_staff IS NOT NULL THEN
    FOREACH v_staff_id IN ARRAY v_staff
    LOOP
      IF v_staff_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM public.business_staff WHERE user_id = v_staff_id)
         AND EXISTS (SELECT 1 FROM public.profiles WHERE id = v_staff_id AND account_type = 'staff')
      THEN
        -- Clear remaining RESTRICT references this staff holds elsewhere.
        UPDATE public.sale_item_returns r
           SET authorized_by = b.owner_id
          FROM public.businesses b
         WHERE r.business_id = b.id
           AND r.authorized_by = v_staff_id;

        UPDATE public.business_staff s
           SET invited_by = b.owner_id
          FROM public.businesses b
         WHERE s.business_id = b.id
           AND s.invited_by = v_staff_id;

        DELETE FROM public.subscriptions    WHERE user_id = v_staff_id;
        DELETE FROM public.otp_verification WHERE user_id = v_staff_id;
        DELETE FROM public.profiles         WHERE id = v_staff_id;

        v_deleted := array_append(v_deleted, v_staff_id);
      END IF;
    END LOOP;
  END IF;

  RETURN v_deleted;
END;
$$;

-- Only the service role (edge function) may run this; never end users directly.
REVOKE ALL ON FUNCTION public.delete_user_account_data(uuid) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.delete_user_account_data(uuid) IS
  'Ordered hard-delete of all data owned by/tied to a user, including the owner profile and orphaned staff profiles. Returns the auth user IDs whose profiles were deleted so the edge function can remove their auth.users rows + storage. Invoked by the delete-account edge function (service role).';
