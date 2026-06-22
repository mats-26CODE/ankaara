-- Staff-aware authorization for loan settlement RPCs

CREATE OR REPLACE FUNCTION public.clear_loan_to_sale(
  p_loan_id uuid,
  p_sale_date date DEFAULT CURRENT_DATE
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_item public.loan_items%ROWTYPE;
  v_sale_item_id uuid;
  v_sale_number text;
BEGIN
  SELECT l.* INTO v_loan
  FROM public.loans l
  WHERE l.id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  PERFORM public.require_business_permission(v_loan.business_id, 'loans', 'edit');

  IF v_loan.outstanding_balance <> 0 THEN
    RAISE EXCEPTION 'Loan must be fully paid before conversion';
  END IF;
  IF v_loan.sale_id IS NOT NULL THEN
    RAISE EXCEPTION 'Loan has already been converted to sale';
  END IF;

  v_sale_number := public.next_sale_number(v_loan.business_id);

  INSERT INTO public.sales (
    business_id, client_id, loan_id, sale_number, source, sale_date, currency,
    subtotal, tax, total, total_cost, profit, notes
  )
  VALUES (
    v_loan.business_id,
    v_loan.client_id,
    v_loan.id,
    v_sale_number,
    'loan',
    COALESCE(p_sale_date, CURRENT_DATE),
    v_loan.currency,
    v_loan.subtotal,
    v_loan.tax,
    v_loan.total,
    v_loan.total_cost,
    v_loan.total - v_loan.total_cost,
    'Settled from loan ' || v_loan.loan_number
  )
  RETURNING * INTO v_sale;

  FOR v_item IN
    SELECT * FROM public.loan_items WHERE loan_id = v_loan.id ORDER BY id
  LOOP
    INSERT INTO public.sale_items (
      sale_id, product_id, description, item_type, quantity,
      base_price, unit_price, discount, total, cost_total, profit
    )
    VALUES (
      v_sale.id, v_item.product_id, v_item.description, v_item.item_type, v_item.quantity,
      v_item.base_price, v_item.unit_price, v_item.discount, v_item.total, v_item.cost_total, v_item.profit
    )
    RETURNING id INTO v_sale_item_id;
  END LOOP;

  UPDATE public.loans
  SET status = 'paid',
      paid_at = COALESCE(p_sale_date::timestamptz, now()),
      sale_id = v_sale.id
  WHERE id = v_loan.id;

  RETURN v_sale;
END;
$$;

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
  WHERE l.id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  PERFORM public.require_business_permission(v_loan.business_id, 'invoices', 'create');

  IF v_loan.invoice_id IS NOT NULL THEN
    SELECT * INTO v_invoice FROM public.invoices WHERE id = v_loan.invoice_id;
    RETURN v_invoice;
  END IF;

  v_invoice_number := public.next_invoice_number(v_loan.business_id);

  INSERT INTO public.invoices (
    business_id,
    client_id,
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
