-- Sale edit (direct) and item returns with stock restoration and audit trail.

-- =============================================================================
-- 1. SALE ITEMS — return tracking
-- =============================================================================
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS returned_quantity numeric(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz;

ALTER TABLE public.sale_items
  DROP CONSTRAINT IF EXISTS sale_items_returned_quantity_check;

ALTER TABLE public.sale_items
  ADD CONSTRAINT sale_items_returned_quantity_check
  CHECK (returned_quantity >= 0 AND returned_quantity <= quantity);

COMMENT ON COLUMN public.sale_items.returned_quantity IS
  'Units returned to stock; original quantity is preserved for audit.';
COMMENT ON COLUMN public.sale_items.returned_at IS
  'Set when returned_quantity equals quantity (fully returned line).';

-- =============================================================================
-- 2. SALE ITEM RETURNS — audit log
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sale_item_returns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_item_id uuid NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity numeric(14,4) NOT NULL CHECK (quantity > 0),
  authorized_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_item_returns_sale_item
  ON public.sale_item_returns(sale_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_item_returns_sale
  ON public.sale_item_returns(sale_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_item_returns_business
  ON public.sale_item_returns(business_id, created_at DESC);

ALTER TABLE public.sale_item_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select sale item returns of accessible businesses" ON public.sale_item_returns;
CREATE POLICY "Users can select sale item returns of accessible businesses"
  ON public.sale_item_returns FOR SELECT TO authenticated
  USING (public.staff_can(business_id, 'sales', 'view'));

COMMENT ON TABLE public.sale_item_returns IS
  'Audit log of sale line returns; inserts only via return_sale_item RPC.';

-- =============================================================================
-- 3. INVENTORY MOVEMENTS — sale_return type
-- =============================================================================
ALTER TABLE public.inventory_movements
  DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT inventory_movements_movement_type_check
  CHECK (
    movement_type IN ('initial', 'adjustment', 'restock', 'sale', 'rollback', 'sale_return')
  );

-- =============================================================================
-- 4. PERMISSION: owner or manager only
-- =============================================================================
CREATE OR REPLACE FUNCTION public.require_owner_or_manager(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = p_business_id AND b.owner_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.business_staff bs
    INNER JOIN public.staff_categories sc ON sc.id = bs.staff_category_id
    WHERE bs.business_id = p_business_id
      AND bs.user_id = auth.uid()
      AND bs.status = 'active'
      AND sc.slug = 'manager'
  ) THEN
    RETURN;
  END IF;

  RAISE EXCEPTION 'FORBIDDEN';
END;
$$;

REVOKE ALL ON FUNCTION public.require_owner_or_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_owner_or_manager(uuid) TO authenticated;

-- =============================================================================
-- 5. HELPERS — net line totals and sale header
-- =============================================================================
CREATE OR REPLACE FUNCTION public.recalc_sale_item_net_totals(p_sale_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.sale_items%ROWTYPE;
  v_net_qty numeric(14,4);
  v_line_discount numeric(14,2);
  v_line_total numeric(14,2);
  v_cost_total numeric(14,2);
  v_profit numeric(14,2);
BEGIN
  SELECT * INTO v_item FROM public.sale_items WHERE id = p_sale_item_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_net_qty := GREATEST(v_item.quantity - v_item.returned_quantity, 0);

  IF v_net_qty <= 0 THEN
    v_line_total := 0;
    v_cost_total := 0;
    v_profit := 0;
  ELSE
    v_line_discount := CASE
      WHEN v_item.quantity > 0 THEN (v_item.discount * v_net_qty / v_item.quantity)
      ELSE 0
    END;
    v_line_total := (v_net_qty * v_item.unit_price) - v_line_discount;
    v_cost_total := v_net_qty * v_item.base_price;
    v_profit := v_line_total - v_cost_total;
  END IF;

  UPDATE public.sale_items
  SET total = v_line_total,
      cost_total = v_cost_total,
      profit = v_profit,
      returned_at = CASE
        WHEN v_item.returned_quantity >= v_item.quantity THEN now()
        ELSE NULL
      END
  WHERE id = p_sale_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_sale_header_totals(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal numeric(14,2);
  v_total_cost numeric(14,2);
  v_total_profit numeric(14,2);
BEGIN
  SELECT
    COALESCE(SUM(total), 0),
    COALESCE(SUM(cost_total), 0),
    COALESCE(SUM(profit), 0)
  INTO v_subtotal, v_total_cost, v_total_profit
  FROM public.sale_items
  WHERE sale_id = p_sale_id;

  UPDATE public.sales
  SET subtotal = v_subtotal,
      total = v_subtotal,
      total_cost = v_total_cost,
      profit = v_total_profit,
      updated_at = now()
  WHERE id = p_sale_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_sale_item_net_totals(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.recalc_sale_header_totals(uuid) FROM PUBLIC, anon;

-- =============================================================================
-- 6. RPC: return_sale_item
-- =============================================================================
CREATE OR REPLACE FUNCTION public.return_sale_item(
  p_sale_item_id uuid,
  p_quantity numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.sale_items%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_remaining numeric(14,4);
  v_stock_before numeric(14,4);
  v_stock_after numeric(14,4);
BEGIN
  IF p_sale_item_id IS NULL THEN
    RAISE EXCEPTION 'Sale item is required';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Return quantity must be greater than zero';
  END IF;

  SELECT si.* INTO v_item
  FROM public.sale_items si
  WHERE si.id = p_sale_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale item not found';
  END IF;

  SELECT s.* INTO v_sale
  FROM public.sales s
  WHERE s.id = v_item.sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  PERFORM public.require_owner_or_manager(v_sale.business_id);
  PERFORM public.require_business_permission(v_sale.business_id, 'sales', 'view');

  IF v_item.item_type = 'service' THEN
    RAISE EXCEPTION 'SERVICE_NOT_RETURNABLE';
  END IF;

  IF v_item.product_id IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_RETURNABLE';
  END IF;

  v_remaining := v_item.quantity - v_item.returned_quantity;

  IF p_quantity > v_remaining THEN
    RAISE EXCEPTION 'RETURN_QUANTITY_EXCEEDS_REMAINING:%', v_remaining;
  END IF;

  SELECT p.* INTO v_product
  FROM public.products p
  WHERE p.id = v_item.product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  INSERT INTO public.sale_item_returns (
    sale_item_id,
    sale_id,
    business_id,
    product_id,
    quantity,
    authorized_by,
    notes
  )
  VALUES (
    v_item.id,
    v_sale.id,
    v_sale.business_id,
    v_item.product_id,
    p_quantity,
    auth.uid(),
    NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  );

  UPDATE public.sale_items
  SET returned_quantity = returned_quantity + p_quantity
  WHERE id = v_item.id;

  PERFORM public.recalc_sale_item_net_totals(v_item.id);

  v_stock_before := v_product.stock_quantity;
  v_stock_after := v_product.stock_quantity + p_quantity;

  UPDATE public.products
  SET stock_quantity = v_stock_after,
      updated_at = now()
  WHERE id = v_product.id;

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
    v_sale.business_id,
    v_product.id,
    v_sale.id,
    v_item.id,
    'sale_return',
    p_quantity,
    v_stock_before,
    v_stock_after,
    v_product.base_price,
    'Return from sale ' || v_sale.sale_number
  );

  PERFORM public.recalc_sale_header_totals(v_sale.id);

  SELECT * INTO v_sale FROM public.sales WHERE id = v_sale.id;
  RETURN v_sale;
END;
$$;

-- =============================================================================
-- 7. RPC: update_direct_sale
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_direct_sale(
  p_sale_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_sale_date date DEFAULT NULL,
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
  v_existing public.sale_items%ROWTYPE;
  v_product_id uuid;
  v_sale_item_id uuid;
  v_item_id uuid;
  v_qty numeric(14,4);
  v_unit_price numeric(14,2);
  v_discount numeric(14,2);
  v_line_total numeric(14,2);
  v_cost_total numeric(14,2);
  v_profit numeric(14,2);
  v_old_effective numeric(14,4);
  v_new_effective numeric(14,4);
  v_stock_delta numeric(14,4);
  v_stock_before numeric(14,4);
  v_stock_after numeric(14,4);
  v_payload_ids uuid[] := ARRAY[]::uuid[];
  v_removed public.sale_items%ROWTYPE;
BEGIN
  IF p_sale_id IS NULL THEN
    RAISE EXCEPTION 'Sale is required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one sale item is required';
  END IF;

  SELECT s.* INTO v_sale
  FROM public.sales s
  WHERE s.id = p_sale_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found';
  END IF;

  PERFORM public.require_owner_or_manager(v_sale.business_id);

  IF v_sale.source IS DISTINCT FROM 'direct' THEN
    RAISE EXCEPTION 'SALE_NOT_EDITABLE';
  END IF;

  UPDATE public.sales
  SET client_id = p_client_id,
      sale_date = COALESCE(p_sale_date, v_sale.sale_date),
      notes = NULLIF(BTRIM(COALESCE(p_notes, '')), ''),
      updated_at = now()
  WHERE id = v_sale.id;

  -- Collect payload item ids
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item ? 'id' AND NULLIF(BTRIM(v_item->>'id'), '') IS NOT NULL THEN
      v_payload_ids := array_append(v_payload_ids, (v_item->>'id')::uuid);
    END IF;
  END LOOP;

  -- Remove lines omitted from payload
  FOR v_removed IN
    SELECT si.*
    FROM public.sale_items si
    WHERE si.sale_id = v_sale.id
      AND NOT (si.id = ANY(v_payload_ids))
    FOR UPDATE
  LOOP
    IF v_removed.returned_quantity > 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_RETURNED_LINE';
    END IF;

    IF v_removed.item_type = 'product' AND v_removed.product_id IS NOT NULL THEN
      SELECT p.* INTO v_product
      FROM public.products p
      WHERE p.id = v_removed.product_id
      FOR UPDATE;

      IF FOUND AND v_removed.quantity > 0 THEN
        v_stock_before := v_product.stock_quantity;
        v_stock_after := v_product.stock_quantity + v_removed.quantity;

        UPDATE public.products
        SET stock_quantity = v_stock_after,
            updated_at = now()
        WHERE id = v_product.id;

        INSERT INTO public.inventory_movements (
          business_id, product_id, sale_id, sale_item_id,
          movement_type, quantity_delta, quantity_before, quantity_after,
          unit_cost, reason
        )
        VALUES (
          v_sale.business_id, v_product.id, v_sale.id, v_removed.id,
          'sale_return', v_removed.quantity, v_stock_before, v_stock_after,
          v_product.base_price,
          'Line removed from sale ' || v_sale.sale_number
        );
      END IF;
    END IF;

    DELETE FROM public.sale_items WHERE id = v_removed.id;
  END LOOP;

  -- Upsert payload lines
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'quantity')::numeric, 1);
    v_discount := COALESCE((v_item->>'discount')::numeric, 0);
    v_item_id := CASE
      WHEN v_item ? 'id' AND NULLIF(BTRIM(v_item->>'id'), '') IS NOT NULL
      THEN (v_item->>'id')::uuid
      ELSE NULL
    END;

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
      AND p.business_id = v_sale.business_id
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

    IF v_item_id IS NOT NULL THEN
      SELECT si.* INTO v_existing
      FROM public.sale_items si
      WHERE si.id = v_item_id
        AND si.sale_id = v_sale.id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale item not found';
      END IF;

      IF v_qty < v_existing.returned_quantity THEN
        RAISE EXCEPTION 'QUANTITY_BELOW_RETURNED:%', v_existing.returned_quantity;
      END IF;

      v_old_effective := v_existing.quantity - v_existing.returned_quantity;
      v_new_effective := v_qty - v_existing.returned_quantity;

      IF v_product.item_type = 'product' THEN
        v_stock_delta := v_old_effective - v_new_effective;

        IF v_stock_delta < 0 THEN
          IF v_product.stock_quantity < ABS(v_stock_delta) THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_product.name;
          END IF;
        END IF;

        IF v_stock_delta <> 0 THEN
          v_stock_before := v_product.stock_quantity;
          v_stock_after := v_product.stock_quantity - v_stock_delta;

          UPDATE public.products
          SET stock_quantity = v_stock_after,
              updated_at = now()
          WHERE id = v_product.id;

          INSERT INTO public.inventory_movements (
            business_id, product_id, sale_id, sale_item_id,
            movement_type, quantity_delta, quantity_before, quantity_after,
            unit_cost, reason
          )
          VALUES (
            v_sale.business_id, v_product.id, v_sale.id, v_existing.id,
            CASE WHEN v_stock_delta > 0 THEN 'sale_return' ELSE 'sale' END,
            CASE WHEN v_stock_delta > 0 THEN v_stock_delta ELSE -ABS(v_stock_delta) END,
            v_stock_before, v_stock_after,
            v_product.base_price,
            'Sale edit ' || v_sale.sale_number
          );
        END IF;
      END IF;

      UPDATE public.sale_items
      SET product_id = v_product.id,
          description = COALESCE(NULLIF(BTRIM(v_item->>'description'), ''), v_product.name),
          item_type = v_product.item_type,
          quantity = v_qty,
          base_price = v_product.base_price,
          unit_price = v_unit_price,
          discount = v_discount,
          total = v_line_total,
          cost_total = v_cost_total,
          profit = v_profit
      WHERE id = v_existing.id;

      PERFORM public.recalc_sale_item_net_totals(v_existing.id);
    ELSE
      IF v_product.item_type = 'product' THEN
        v_new_effective := v_qty;

        IF v_product.stock_quantity < v_new_effective THEN
          RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_product.name;
        END IF;

        v_stock_before := v_product.stock_quantity;
        v_stock_after := v_product.stock_quantity - v_new_effective;

        UPDATE public.products
        SET stock_quantity = v_stock_after,
            updated_at = now()
        WHERE id = v_product.id;
      END IF;

      INSERT INTO public.sale_items (
        sale_id, product_id, description, item_type,
        quantity, base_price, unit_price, discount,
        total, cost_total, profit
      )
      VALUES (
        v_sale.id, v_product.id,
        COALESCE(NULLIF(BTRIM(v_item->>'description'), ''), v_product.name),
        v_product.item_type, v_qty, v_product.base_price, v_unit_price, v_discount,
        v_line_total, v_cost_total, v_profit
      )
      RETURNING id INTO v_sale_item_id;

      IF v_product.item_type = 'product' THEN
        INSERT INTO public.inventory_movements (
          business_id, product_id, sale_id, sale_item_id,
          movement_type, quantity_delta, quantity_before, quantity_after,
          unit_cost, reason
        )
        VALUES (
          v_sale.business_id, v_product.id, v_sale.id, v_sale_item_id,
          'sale', -v_qty, v_stock_before, v_stock_after,
          v_product.base_price,
          'Sale edit ' || v_sale.sale_number
        );
      END IF;
    END IF;
  END LOOP;

  PERFORM public.recalc_sale_header_totals(v_sale.id);

  SELECT * INTO v_sale FROM public.sales WHERE id = v_sale.id;
  RETURN v_sale;
END;
$$;

-- =============================================================================
-- 8. PRODUCT SALES PERFORMANCE — net quantities after returns
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_product_sales_performance(
  p_business_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  sku text,
  units_sold numeric,
  revenue numeric,
  cogs numeric,
  profit numeric,
  sale_count bigint,
  is_orphan_line boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_business_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM public.require_plan_feature(auth.uid(), 'product_sales_reports');

  RETURN QUERY
  SELECT
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ) AS product_name,
    p.sku,
    COALESCE(SUM(GREATEST(si.quantity - si.returned_quantity, 0)), 0)::numeric AS units_sold,
    COALESCE(SUM(si.total), 0)::numeric AS revenue,
    COALESCE(SUM(si.cost_total), 0)::numeric AS cogs,
    COALESCE(SUM(si.profit), 0)::numeric AS profit,
    COUNT(DISTINCT si.sale_id)::bigint AS sale_count,
    (si.product_id IS NULL) AS is_orphan_line
  FROM public.sale_items si
  INNER JOIN public.sales s ON s.id = si.sale_id
  LEFT JOIN public.products p ON p.id = si.product_id
  WHERE s.business_id = p_business_id
    AND si.item_type = 'product'
    AND (p_from_date IS NULL OR s.sale_date >= p_from_date)
    AND (p_to_date IS NULL OR s.sale_date <= p_to_date)
  GROUP BY
    si.product_id,
    COALESCE(
      NULLIF(BTRIM(p.name), ''),
      NULLIF(BTRIM(si.description), ''),
      'Unknown product'
    ),
    p.sku
  ORDER BY revenue DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.return_sale_item(uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_direct_sale(uuid, uuid, date, text, jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.return_sale_item(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_direct_sale(uuid, uuid, date, text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.return_sale_item IS
  'Partial or full return of a product sale line; restores stock and logs authorized_by.';
COMMENT ON FUNCTION public.update_direct_sale IS
  'Edit a direct POS sale header and lines; owner or manager only.';
