-- Staff-aware RPC authorization patches

CREATE OR REPLACE FUNCTION public.create_direct_sale(
  p_business_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_sale_date date DEFAULT CURRENT_DATE,
  p_currency text DEFAULT 'TZS',
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.sales%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric(14,4);
  v_unit_price numeric(14,2);
  v_discount numeric(14,2);
  v_line_total numeric(14,2);
  v_cost_total numeric(14,2);
  v_profit numeric(14,2);
  v_sale_item_id uuid;
  v_sale_number text;
  v_subtotal numeric(14,2) := 0;
  v_total_cost numeric(14,2) := 0;
  v_total_profit numeric(14,2) := 0;
  v_stock_before numeric(14,4);
  v_stock_after numeric(14,4);
BEGIN
  PERFORM public.require_business_permission(p_business_id, 'sales', 'create');

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one sale item is required';
  END IF;

  v_sale_number := public.next_sale_number(p_business_id);

  INSERT INTO public.sales (
    business_id,
    client_id,
    sale_number,
    source,
    sale_date,
    currency,
    notes
  )
  VALUES (
    p_business_id,
    p_client_id,
    v_sale_number,
    'direct',
    COALESCE(p_sale_date, CURRENT_DATE),
    COALESCE(NULLIF(p_currency, ''), 'TZS'),
    NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  )
  RETURNING * INTO v_sale;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 1);
    v_discount := COALESCE((v_item->>'discount')::numeric, 0);

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Direct sale items must reference a product or service';
    END IF;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Sale quantity must be greater than zero';
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
      SET stock_quantity = v_stock_after,
          updated_at = now()
      WHERE id = v_product.id;
    END IF;

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      description,
      item_type,
      quantity,
      base_price,
      unit_price,
      discount,
      total,
      cost_total,
      profit
    )
    VALUES (
      v_sale.id,
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
    RETURNING id INTO v_sale_item_id;

    IF v_product.item_type = 'product' THEN
      INSERT INTO public.inventory_movements (
        business_id,
        product_id,
        sale_id,
        sale_item_id,
        movement_type,
        quantity_delta,
        quantity_before,
        quantity_after,
        unit_cost,
        reason
      )
      VALUES (
        p_business_id,
        v_product.id,
        v_sale.id,
        v_sale_item_id,
        'sale',
        -v_qty,
        v_stock_before,
        v_stock_after,
        v_product.base_price,
        'Direct sale ' || v_sale.sale_number
      );
    END IF;

    v_subtotal := v_subtotal + v_line_total;
    v_total_cost := v_total_cost + v_cost_total;
    v_total_profit := v_total_profit + v_profit;
  END LOOP;

  UPDATE public.sales
  SET subtotal = v_subtotal,
      total = v_subtotal,
      total_cost = v_total_cost,
      profit = v_total_profit
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  RETURN v_sale;
END;
$$;

-- =============================================================================
-- 8. PAID INVOICE TO SALE RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.convert_invoice_to_sale(
  p_invoice_id uuid,
  p_sale_date date DEFAULT CURRENT_DATE
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_invoice_item public.invoice_items%ROWTYPE;
  v_item_type text;
  v_base_price numeric(14,2);
  v_qty numeric(14,4);
  v_line_total numeric(14,2);
  v_cost_total numeric(14,2);
  v_profit numeric(14,2);
  v_sale_item_id uuid;
  v_sale_number text;
  v_total_cost numeric(14,2) := 0;
  v_total_profit numeric(14,2) := 0;
  v_stock_before numeric(14,4);
  v_stock_after numeric(14,4);
BEGIN
  SELECT i.* INTO v_invoice
  FROM public.invoices i
  WHERE i.id = p_invoice_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  PERFORM public.require_business_permission(v_invoice.business_id, 'invoices', 'edit');

  IF v_invoice.status <> 'paid' THEN
    RAISE EXCEPTION 'Only paid invoices can be converted to sales';
  END IF;

  IF EXISTS (SELECT 1 FROM public.sales WHERE invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'Invoice has already been converted to a sale';
  END IF;

  v_sale_number := public.next_sale_number(v_invoice.business_id);

  INSERT INTO public.sales (
    business_id,
    client_id,
    invoice_id,
    sale_number,
    source,
    sale_date,
    currency,
    subtotal,
    tax,
    total,
    notes
  )
  VALUES (
    v_invoice.business_id,
    v_invoice.client_id,
    v_invoice.id,
    v_sale_number,
    'invoice',
    COALESCE(p_sale_date, CURRENT_DATE),
    v_invoice.currency,
    v_invoice.subtotal,
    v_invoice.tax,
    v_invoice.total,
    'Converted from invoice ' || v_invoice.invoice_number
  )
  RETURNING * INTO v_sale;

  FOR v_invoice_item IN
    SELECT * FROM public.invoice_items
    WHERE invoice_id = p_invoice_id
    ORDER BY id
  LOOP
    v_qty := COALESCE(v_invoice_item.quantity, 1);
    v_line_total :=
      COALESCE(v_invoice_item.total, (v_qty * v_invoice_item.unit_price) - COALESCE(v_invoice_item.discount, 0));
    v_item_type := 'service';
    v_base_price := 0;
    v_cost_total := 0;
    v_stock_before := NULL;
    v_stock_after := NULL;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invoice contains an invalid item quantity';
    END IF;

    IF v_invoice_item.product_id IS NOT NULL THEN
      SELECT p.* INTO v_product
      FROM public.products p
      WHERE p.id = v_invoice_item.product_id
        AND p.business_id = v_invoice.business_id
      FOR UPDATE;

      IF FOUND THEN
        v_item_type := v_product.item_type;
        v_base_price := v_product.base_price;
        v_cost_total := v_qty * v_product.base_price;

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
          SET stock_quantity = v_stock_after,
              updated_at = now()
          WHERE id = v_product.id;
        END IF;
      END IF;
    END IF;

    v_profit := v_line_total - v_cost_total;

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      description,
      item_type,
      quantity,
      base_price,
      unit_price,
      discount,
      total,
      cost_total,
      profit
    )
    VALUES (
      v_sale.id,
      v_invoice_item.product_id,
      v_invoice_item.description,
      v_item_type,
      v_qty,
      v_base_price,
      v_invoice_item.unit_price,
      COALESCE(v_invoice_item.discount, 0),
      v_line_total,
      v_cost_total,
      v_profit
    )
    RETURNING id INTO v_sale_item_id;

    IF v_invoice_item.product_id IS NOT NULL AND v_item_type = 'product' THEN
      INSERT INTO public.inventory_movements (
        business_id,
        product_id,
        sale_id,
        sale_item_id,
        movement_type,
        quantity_delta,
        quantity_before,
        quantity_after,
        unit_cost,
        reason
      )
      VALUES (
        v_invoice.business_id,
        v_invoice_item.product_id,
        v_sale.id,
        v_sale_item_id,
        'sale',
        -v_qty,
        v_stock_before,
        v_stock_after,
        v_base_price,
        'Invoice conversion ' || v_invoice.invoice_number
      );
    END IF;

    v_total_cost := v_total_cost + v_cost_total;
    v_total_profit := v_total_profit + v_profit;
  END LOOP;

  UPDATE public.sales
  SET total_cost = v_total_cost,
      profit = v_total_profit
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  RETURN v_sale;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_direct_sale(uuid, uuid, date, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.convert_invoice_to_sale(uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_sale_number(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_line_price_not_below_base_price()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_direct_sale(uuid, uuid, date, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_invoice_to_sale(uuid, date) TO authenticated;

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
  PERFORM public.require_business_permission(p_business_id, 'loans', 'create');

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
  v_payment_date date := COALESCE(p_payment_date, CURRENT_DATE);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT l.* INTO v_loan
  FROM public.loans l
  WHERE l.id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  PERFORM public.require_business_permission(v_loan.business_id, 'loans', 'edit');
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


CREATE OR REPLACE FUNCTION public.ensure_walk_in_client(p_business_id uuid)
RETURNS public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_client public.clients%ROWTYPE;
BEGIN
  PERFORM public.require_business_permission(p_business_id, 'clients', 'create');

  SELECT * INTO v_client
  FROM public.clients
  WHERE business_id = p_business_id
    AND is_walk_in = true
  LIMIT 1;

  IF FOUND THEN
    RETURN v_client;
  END IF;

  BEGIN
    INSERT INTO public.clients (business_id, name, is_walk_in)
    VALUES (p_business_id, 'Walk-in Customer', true)
    RETURNING * INTO v_client;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_client
    FROM public.clients
    WHERE business_id = p_business_id
      AND is_walk_in = true
    LIMIT 1;
  END;

  RETURN v_client;
END;
$function$;

