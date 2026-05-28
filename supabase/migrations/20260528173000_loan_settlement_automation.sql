-- Automate loan settlement flows:
-- 1) Fully paid loans auto-convert to sales.
-- 2) Invoice->sale conversions auto-clear linked loans.

CREATE OR REPLACE FUNCTION public.record_loan_payment(
  p_loan_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT CURRENT_DATE,
  p_method text DEFAULT 'cash',
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.loans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_new_outstanding numeric(14,2);
  v_payment_date date := COALESCE(p_payment_date, CURRENT_DATE);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT l.* INTO v_loan
  FROM public.loans l
  JOIN public.businesses b ON b.id = l.business_id
  WHERE l.id = p_loan_id AND b.owner_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  IF v_loan.status = 'paid' THEN
    RAISE EXCEPTION 'Loan is already fully paid';
  END IF;
  IF p_amount > v_loan.outstanding_balance THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance';
  END IF;

  INSERT INTO public.loan_payments (
    loan_id, business_id, payment_date, amount, method, reference, notes
  )
  VALUES (
    v_loan.id, v_loan.business_id, v_payment_date,
    p_amount, COALESCE(NULLIF(BTRIM(p_method), ''), 'cash'),
    NULLIF(BTRIM(COALESCE(p_reference, '')), ''),
    NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  );

  v_new_outstanding := v_loan.outstanding_balance - p_amount;

  UPDATE public.loans
  SET outstanding_balance = v_new_outstanding,
      status = CASE
        WHEN v_new_outstanding = 0 THEN 'paid'
        ELSE 'partially_paid'
      END,
      paid_at = CASE WHEN v_new_outstanding = 0 THEN now() ELSE paid_at END
  WHERE id = v_loan.id
  RETURNING * INTO v_loan;

  -- Automate loan->sale conversion on final payment.
  IF v_new_outstanding = 0 AND v_loan.sale_id IS NULL THEN
    PERFORM public.clear_loan_to_sale(v_loan.id, v_payment_date);
    SELECT * INTO v_loan FROM public.loans WHERE id = v_loan.id;
  END IF;

  RETURN v_loan;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_invoice_sale_linked_loan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source = 'invoice' AND NEW.invoice_id IS NOT NULL THEN
    UPDATE public.loans
    SET status = 'paid',
        outstanding_balance = 0,
        paid_at = COALESCE(NEW.sale_date::timestamptz, now()),
        sale_id = NEW.id
    WHERE invoice_id = NEW.invoice_id
      AND sale_id IS NULL
      AND status <> 'cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_link_invoice_loan ON public.sales;
CREATE TRIGGER sales_link_invoice_loan
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_invoice_sale_linked_loan();

REVOKE ALL ON FUNCTION public.record_loan_payment(uuid, numeric, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_loan_payment(uuid, numeric, date, text, text, text) TO authenticated;
