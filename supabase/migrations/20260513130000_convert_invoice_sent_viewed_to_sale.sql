-- Allow convert_invoice_to_sale for sent/viewed invoices (mark paid first).
-- Draft, cancelled, and overdue remain blocked. Paid unchanged.
-- Future: payment gateway webhooks should set status paid and call this RPC with p_sale_date = paid date.

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
  JOIN public.businesses b ON b.id = i.business_id
  WHERE i.id = p_invoice_id
    AND b.owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status NOT IN ('sent', 'viewed', 'paid') THEN
    RAISE EXCEPTION 'INVOICE_STATUS_NOT_ELIGIBLE_FOR_SALE_CONVERSION';
  END IF;

  IF EXISTS (SELECT 1 FROM public.sales WHERE invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'Invoice has already been converted to a sale';
  END IF;

  IF v_invoice.status IN ('sent', 'viewed') THEN
    UPDATE public.invoices
    SET status = 'paid',
        updated_at = now()
    WHERE id = p_invoice_id;
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

COMMENT ON FUNCTION public.convert_invoice_to_sale(uuid, date) IS
  'Creates a sale from an invoice in sent, viewed, or paid status; marks sent/viewed as paid; blocks draft/cancelled/overdue.';
