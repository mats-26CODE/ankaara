-- POS finance features: expenses, client loans, and loan settlement to sales.

-- =============================================================================
-- 1. EXPENSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'cash',
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business_date
  ON public.expenses(business_id, expense_date DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD expenses of own businesses" ON public.expenses;
CREATE POLICY "Users can CRUD expenses of own businesses"
  ON public.expenses
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- 2. LOANS TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  loan_number text NOT NULL,
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_paid', 'paid', 'cancelled')),
  currency text NOT NULL DEFAULT 'TZS',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  outstanding_balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (outstanding_balance >= 0),
  notes text,
  paid_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_business_number
  ON public.loans(business_id, loan_number);

CREATE INDEX IF NOT EXISTS idx_loans_business_date
  ON public.loans(business_id, loan_date DESC);

CREATE INDEX IF NOT EXISTS idx_loans_client
  ON public.loans(client_id);

CREATE TABLE IF NOT EXISTS public.loan_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  item_type text NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  quantity numeric(14,4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  base_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0,
  cost_total numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_loan_items_loan
  ON public.loan_items(loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_items_product
  ON public.loan_items(product_id);

CREATE TABLE IF NOT EXISTS public.loan_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash',
  reference text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan
  ON public.loan_payments(loan_id, payment_date DESC);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD loans of own businesses" ON public.loans;
CREATE POLICY "Users can CRUD loans of own businesses"
  ON public.loans
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can CRUD loan items of own loans" ON public.loan_items;
CREATE POLICY "Users can CRUD loan items of own loans"
  ON public.loan_items
  FOR ALL
  USING (
    loan_id IN (
      SELECT l.id
      FROM public.loans l
      JOIN public.businesses b ON b.id = l.business_id
      WHERE b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    loan_id IN (
      SELECT l.id
      FROM public.loans l
      JOIN public.businesses b ON b.id = l.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can CRUD loan payments of own businesses" ON public.loan_payments;
CREATE POLICY "Users can CRUD loan payments of own businesses"
  ON public.loan_payments
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS loans_updated_at ON public.loans;
CREATE TRIGGER loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================================================
-- 3. SALES EXTENSIONS
-- =============================================================================
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL;

ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_source_check;

ALTER TABLE public.sales
  ADD CONSTRAINT sales_source_check CHECK (source IN ('direct', 'invoice', 'loan'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_loan_once
  ON public.sales(loan_id)
  WHERE loan_id IS NOT NULL;

-- =============================================================================
-- 4. LOAN RPCs
-- =============================================================================
CREATE OR REPLACE FUNCTION public.next_loan_number(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(loan_number, '[^0-9]', '', 'g'), '')::bigint
  ), 0) + 1
  INTO n
  FROM public.loans
  WHERE business_id = p_business_id;

  RETURN 'LOAN-' || LPAD(n::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_loan(
  p_business_id uuid,
  p_client_id uuid,
  p_loan_date date DEFAULT CURRENT_DATE,
  p_currency text DEFAULT 'TZS',
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS public.loans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric(14,4);
  v_unit_price numeric(14,2);
  v_discount numeric(14,2);
  v_line_total numeric(14,2);
  v_cost_total numeric(14,2);
  v_profit numeric(14,2);
  v_loan_item_id uuid;
  v_loan_number text;
  v_subtotal numeric(14,2) := 0;
  v_total_cost numeric(14,2) := 0;
  v_total_profit numeric(14,2) := 0;
  v_stock_before numeric(14,4);
  v_stock_after numeric(14,4);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = p_business_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.clients WHERE id = p_client_id AND business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one loan item is required';
  END IF;

  v_loan_number := public.next_loan_number(p_business_id);

  INSERT INTO public.loans (
    business_id,
    client_id,
    loan_number,
    loan_date,
    currency,
    notes
  )
  VALUES (
    p_business_id,
    p_client_id,
    v_loan_number,
    COALESCE(p_loan_date, CURRENT_DATE),
    COALESCE(NULLIF(p_currency, ''), 'TZS'),
    NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  )
  RETURNING * INTO v_loan;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 1);
    v_discount := COALESCE((v_item->>'discount')::numeric, 0);

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Loan items must reference a product or service';
    END IF;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Loan quantity must be greater than zero';
    END IF;
    IF v_discount < 0 THEN
      RAISE EXCEPTION 'Discount must not be negative';
    END IF;

    SELECT p.* INTO v_product
    FROM public.products p
    WHERE p.id = v_product_id
      AND p.business_id = p_business_id
      AND p.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product or service not found';
    END IF;

    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, v_product.selling_price);
    v_line_total := (v_qty * v_unit_price) - v_discount;
    v_cost_total := v_qty * v_product.base_price;
    v_profit := v_line_total - v_cost_total;

    IF v_line_total < 0 THEN
      RAISE EXCEPTION 'Line total must not be negative';
    END IF;
    IF (v_line_total / v_qty) < v_product.base_price THEN
      RAISE EXCEPTION 'PRICE_BELOW_BASE:%', v_product.base_price;
    END IF;

    IF v_product.item_type = 'product' THEN
      IF v_product.stock_quantity < v_qty THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_product.name;
      END IF;
      v_stock_before := v_product.stock_quantity;
      v_stock_after := v_product.stock_quantity - v_qty;
      UPDATE public.products
      SET stock_quantity = v_stock_after, updated_at = now()
      WHERE id = v_product.id;
    END IF;

    INSERT INTO public.loan_items (
      loan_id, product_id, description, item_type, quantity,
      base_price, unit_price, discount, total, cost_total, profit
    )
    VALUES (
      v_loan.id,
      v_product.id,
      COALESCE(NULLIF(BTRIM(v_item->>'description'), ''), v_product.name),
      v_product.item_type,
      v_qty,
      v_product.base_price,
      v_unit_price,
      v_discount,
      v_line_total,
      v_cost_total,
      v_profit
    )
    RETURNING id INTO v_loan_item_id;

    IF v_product.item_type = 'product' THEN
      INSERT INTO public.inventory_movements (
        business_id, product_id, movement_type, quantity_delta,
        quantity_before, quantity_after, unit_cost, reason
      )
      VALUES (
        p_business_id,
        v_product.id,
        'sale',
        -v_qty,
        v_stock_before,
        v_stock_after,
        v_product.base_price,
        'Loan issue ' || v_loan.loan_number
      );
    END IF;

    v_subtotal := v_subtotal + v_line_total;
    v_total_cost := v_total_cost + v_cost_total;
    v_total_profit := v_total_profit + v_profit;
  END LOOP;

  UPDATE public.loans
  SET subtotal = v_subtotal,
      total = v_subtotal,
      total_cost = v_total_cost,
      outstanding_balance = v_subtotal
  WHERE id = v_loan.id
  RETURNING * INTO v_loan;

  RETURN v_loan;
END;
$$;

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
    v_loan.id, v_loan.business_id, COALESCE(p_payment_date, CURRENT_DATE),
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

  RETURN v_loan;
END;
$$;

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
  JOIN public.businesses b ON b.id = l.business_id
  WHERE l.id = p_loan_id AND b.owner_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;
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

REVOKE ALL ON FUNCTION public.next_loan_number(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_loan(uuid, uuid, date, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_loan_payment(uuid, numeric, date, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.clear_loan_to_sale(uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_invoice_from_loan(uuid, date, date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_loan(uuid, uuid, date, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_loan_payment(uuid, numeric, date, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_loan_to_sale(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_from_loan(uuid, date, date) TO authenticated;
