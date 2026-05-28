-- Add direct invoice -> loan linkage for easier querying of loan-generated invoices.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_loan_id
  ON public.invoices(loan_id)
  WHERE loan_id IS NOT NULL;

-- Backfill existing invoices that were generated from loans.
UPDATE public.invoices i
SET loan_id = l.id
FROM public.loans l
WHERE l.invoice_id = i.id
  AND i.loan_id IS NULL;

CREATE OR REPLACE FUNCTION public.create_invoice_from_loan(
  p_loan_id uuid,
  p_issue_date date DEFAULT CURRENT_DATE,
  p_due_date date DEFAULT NULL
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_invoice public.invoices%ROWTYPE;
  v_item public.loan_items%ROWTYPE;
  v_invoice_number text;
BEGIN
  SELECT l.* INTO v_loan
  FROM public.loans l
  JOIN public.businesses b ON b.id = l.business_id
  WHERE l.id = p_loan_id AND b.owner_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
  IF v_loan.invoice_id IS NOT NULL THEN
    SELECT * INTO v_invoice FROM public.invoices WHERE id = v_loan.invoice_id;
    RETURN v_invoice;
  END IF;

  v_invoice_number := public.next_invoice_number(v_loan.business_id);

  INSERT INTO public.invoices (
    business_id,
    client_id,
    loan_id,
    invoice_number,
    status,
    issue_date,
    due_date,
    subtotal,
    tax,
    total,
    currency,
    notes
  )
  VALUES (
    v_loan.business_id,
    v_loan.client_id,
    v_loan.id,
    v_invoice_number,
    'sent',
    COALESCE(p_issue_date, CURRENT_DATE),
    COALESCE(p_due_date, COALESCE(p_issue_date, CURRENT_DATE) + 7),
    v_loan.subtotal,
    v_loan.tax,
    v_loan.total,
    v_loan.currency,
    'Generated from loan ' || v_loan.loan_number
  )
  RETURNING * INTO v_invoice;

  FOR v_item IN SELECT * FROM public.loan_items WHERE loan_id = v_loan.id ORDER BY id
  LOOP
    INSERT INTO public.invoice_items (
      invoice_id,
      product_id,
      description,
      quantity,
      unit_price,
      discount,
      total
    )
    VALUES (
      v_invoice.id,
      v_item.product_id,
      v_item.description,
      v_item.quantity,
      v_item.unit_price,
      v_item.discount,
      v_item.total
    );
  END LOOP;

  UPDATE public.loans
  SET invoice_id = v_invoice.id
  WHERE id = v_loan.id;

  RETURN v_invoice;
END;
$$;
