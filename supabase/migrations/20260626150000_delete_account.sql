-- Account deletion: ordered cleanup of all data owned by / tied to a user.
--
-- A plain `auth.admin.deleteUser()` cascade is NOT safe here because several
-- foreign keys use ON DELETE RESTRICT and would abort the cascade:
--   * invoices.client_id   -> clients   RESTRICT
--   * loans.client_id      -> clients   RESTRICT
--   * quotations.client_id -> clients   RESTRICT
--   * business_staff.staff_category_id -> staff_categories RESTRICT
--   * business_staff.invited_by        -> profiles         RESTRICT
--   * sale_item_returns.authorized_by  -> profiles         RESTRICT
--
-- This function removes everything in dependency order, then the edge function
-- calls auth.admin.deleteUser() to drop the auth row (cascading profiles and
-- any remaining CASCADE/SET NULL references).
--
-- Called only by the `delete-account` edge function via the service role.

CREATE OR REPLACE FUNCTION public.delete_user_account_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_biz uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
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
  FOR v_biz IN
    SELECT id FROM public.businesses WHERE owner_id = p_user_id
  LOOP
    DELETE FROM public.invoices       WHERE business_id = v_biz; -- cascades invoice_items, payments, payment_transactions, invoice_views
    DELETE FROM public.quotations     WHERE business_id = v_biz; -- cascades quotation_items, quotation_views
    DELETE FROM public.loans          WHERE business_id = v_biz; -- cascades loan_items, loan_payments
    DELETE FROM public.business_staff WHERE business_id = v_biz; -- clears invited_by / staff_category_id RESTRICT
    DELETE FROM public.businesses     WHERE id = v_biz;          -- cascades clients, products, sales, expenses, etc.
  END LOOP;

  -- 3. Per-user rows that are not removed by a business cascade.
  DELETE FROM public.subscriptions   WHERE user_id = p_user_id; -- cascades subscription_payments
  DELETE FROM public.otp_verification WHERE user_id = p_user_id;

  -- 4. Memberships where the user is staff of someone else's business.
  DELETE FROM public.business_staff  WHERE user_id = p_user_id;
END;
$$;

-- Only the service role (edge function) may run this; never end users directly.
REVOKE ALL ON FUNCTION public.delete_user_account_data(uuid) FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.delete_user_account_data(uuid) IS
  'Ordered hard-delete of all data owned by/tied to a user. Invoked by the delete-account edge function (service role) before auth.admin.deleteUser().';
