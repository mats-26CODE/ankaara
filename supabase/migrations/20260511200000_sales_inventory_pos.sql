-- Sales and inventory foundation for POS.
-- Adds product/service typing, cost/selling prices, stock tracking, sales ledger,
-- and RPCs for atomic stock movement + paid-invoice conversion.

-- =============================================================================
-- 1. PRODUCT / SERVICE CATALOG UPGRADE
-- =============================================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS base_price numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS stock_quantity numeric(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold numeric(14,4),
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.products
SET selling_price = unit_price
WHERE selling_price IS NULL;

ALTER TABLE public.products
  ALTER COLUMN selling_price SET DEFAULT 0,
  ALTER COLUMN selling_price SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_item_type_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_item_type_check CHECK (item_type IN ('product', 'service'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_prices_nonnegative_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_prices_nonnegative_check CHECK (base_price >= 0 AND selling_price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_selling_price_above_base_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_selling_price_above_base_check CHECK (selling_price >= base_price);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_quantity_nonnegative_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_quantity_nonnegative_check CHECK (stock_quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_low_stock_threshold_nonnegative_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_low_stock_threshold_nonnegative_check
        CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_sku
  ON public.products(business_id, sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_business_item_type
  ON public.products(business_id, item_type);

CREATE INDEX IF NOT EXISTS idx_products_business_active
  ON public.products(business_id, is_active);

COMMENT ON COLUMN public.products.item_type IS 'Catalog item kind: product consumes stock, service does not.';
COMMENT ON COLUMN public.products.base_price IS 'Cost/buying price used for profit and minimum sale price checks.';
COMMENT ON COLUMN public.products.selling_price IS 'Default selling price used on invoices, quotations, and sales.';
COMMENT ON COLUMN public.products.stock_quantity IS 'Current tracked stock quantity for products. Services do not consume stock.';

-- =============================================================================
-- 2. SALES LEDGER
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  sale_number text NOT NULL,
  source text NOT NULL DEFAULT 'direct' CHECK (source IN ('direct', 'invoice')),
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  currency text NOT NULL DEFAULT 'TZS',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_business_number
  ON public.sales(business_id, sale_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoice_once
  ON public.sales(invoice_id)
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_business_date
  ON public.sales(business_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_business_source
  ON public.sales(business_id, source);

CREATE INDEX IF NOT EXISTS idx_sales_client
  ON public.sales(client_id);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD sales of own businesses" ON public.sales;
CREATE POLICY "Users can CRUD sales of own businesses"
  ON public.sales
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

DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

COMMENT ON TABLE public.sales IS 'POS sales ledger. Direct sales and paid-invoice conversions are recorded here.';
COMMENT ON COLUMN public.sales.sale_date IS 'Business date when the sale happened; can be backdated.';
COMMENT ON COLUMN public.sales.recorded_at IS 'Audit timestamp for when the sale was entered into the app.';

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_sale_items_sale
  ON public.sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product
  ON public.sale_items(product_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD items of own sales" ON public.sale_items;
CREATE POLICY "Users can CRUD items of own sales"
  ON public.sale_items
  FOR ALL
  USING (
    sale_id IN (
      SELECT s.id FROM public.sales s
      JOIN public.businesses b ON b.id = s.business_id
      WHERE b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    sale_id IN (
      SELECT s.id FROM public.sales s
      JOIN public.businesses b ON b.id = s.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE public.sale_items IS 'Snapshot of products/services sold in a sale. Prices and costs are preserved historically.';

-- =============================================================================
-- 3. INVENTORY MOVEMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  sale_item_id uuid REFERENCES public.sale_items(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (
    movement_type IN ('initial', 'adjustment', 'restock', 'sale', 'rollback')
  ),
  quantity_delta numeric(14,4) NOT NULL,
  quantity_before numeric(14,4) NOT NULL,
  quantity_after numeric(14,4) NOT NULL,
  unit_cost numeric(14,2),
  reason text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_business_product
  ON public.inventory_movements(business_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product
  ON public.inventory_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_sale
  ON public.inventory_movements(sale_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_sale_item
  ON public.inventory_movements(sale_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by
  ON public.inventory_movements(created_by);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD inventory movements of own businesses" ON public.inventory_movements;
CREATE POLICY "Users can CRUD inventory movements of own businesses"
  ON public.inventory_movements
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

COMMENT ON TABLE public.inventory_movements IS 'Append-only stock movement history for product inventory.';

-- =============================================================================
-- 4. PRICE GUARDS FOR PRODUCT-LINKED LINES
-- =============================================================================
CREATE OR REPLACE FUNCTION public.ensure_line_price_not_below_base_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_price numeric(14,2);
  v_quantity numeric(14,4);
  v_net_unit_price numeric(14,4);
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT base_price INTO v_base_price
  FROM public.products
  WHERE id = NEW.product_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_quantity := COALESCE(NEW.quantity, 0);
  IF v_quantity <= 0 THEN
    RETURN NEW;
  END IF;

  v_net_unit_price :=
    ((v_quantity * COALESCE(NEW.unit_price, 0)) - COALESCE(NEW.discount, 0)) / v_quantity;

  IF v_net_unit_price < v_base_price THEN
    RAISE EXCEPTION 'PRICE_BELOW_BASE:%', v_base_price;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoice_items_price_guard ON public.invoice_items;
CREATE TRIGGER invoice_items_price_guard
  BEFORE INSERT OR UPDATE OF product_id, quantity, unit_price, discount
  ON public.invoice_items
  FOR EACH ROW EXECUTE PROCEDURE public.ensure_line_price_not_below_base_price();

DROP TRIGGER IF EXISTS quotation_items_price_guard ON public.quotation_items;
CREATE TRIGGER quotation_items_price_guard
  BEFORE INSERT OR UPDATE OF product_id, quantity, unit_price, discount
  ON public.quotation_items
  FOR EACH ROW EXECUTE PROCEDURE public.ensure_line_price_not_below_base_price();

DROP TRIGGER IF EXISTS sale_items_price_guard ON public.sale_items;
CREATE TRIGGER sale_items_price_guard
  BEFORE INSERT OR UPDATE OF product_id, quantity, unit_price, discount
  ON public.sale_items
  FOR EACH ROW EXECUTE PROCEDURE public.ensure_line_price_not_below_base_price();

-- =============================================================================
-- 5. SALE NUMBERING
-- =============================================================================
CREATE OR REPLACE FUNCTION public.next_sale_number(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(sale_number, '[^0-9]', '', 'g'), '')::bigint
  ), 0) + 1
  INTO n
  FROM public.sales
  WHERE business_id = p_business_id;

  RETURN 'SAL-' || LPAD(n::text, 4, '0');
END;
$$;

-- =============================================================================
-- 6. STOCK ADJUSTMENT RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id uuid,
  p_quantity_delta numeric,
  p_movement_type text DEFAULT 'adjustment',
  p_reason text DEFAULT NULL,
  p_unit_cost numeric DEFAULT NULL
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_after numeric(14,4);
  v_movement public.inventory_movements%ROWTYPE;
BEGIN
  IF p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'Quantity change must not be zero';
  END IF;

  IF p_movement_type NOT IN ('initial', 'adjustment', 'restock', 'rollback') THEN
    RAISE EXCEPTION 'Invalid stock movement type';
  END IF;

  SELECT p.* INTO v_product
  FROM public.products p
  JOIN public.businesses b ON b.id = p.business_id
  WHERE p.id = p_product_id
    AND b.owner_id = auth.uid()
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.item_type <> 'product' THEN
    RAISE EXCEPTION 'Services do not track stock';
  END IF;

  v_after := v_product.stock_quantity + p_quantity_delta;
  IF v_after < 0 THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  UPDATE public.products
  SET stock_quantity = v_after,
      updated_at = now()
  WHERE id = v_product.id;

  INSERT INTO public.inventory_movements (
    business_id,
    product_id,
    movement_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    unit_cost,
    reason
  )
  VALUES (
    v_product.business_id,
    v_product.id,
    p_movement_type,
    p_quantity_delta,
    v_product.stock_quantity,
    v_after,
    p_unit_cost,
    p_reason
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

-- =============================================================================
-- 7. DIRECT SALE RPC
-- =============================================================================
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
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = p_business_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

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
  JOIN public.businesses b ON b.id = i.business_id
  WHERE i.id = p_invoice_id
    AND b.owner_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

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
