-- Quotations: create quotations and quotation_items tables, link to invoices.
-- Free plan: 10 quotations total. Pro/Business: unlimited.
-- Quotations share similar structure to invoices (business, client, items, templates).

-- =============================================================================
-- 1. QUOTATIONS TABLE
-- =============================================================================
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  quotation_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'expired', 'cancelled')),
  issue_date date NOT NULL,
  valid_until date,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  tax_percentage numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  notes text,
  template_id text NOT NULL DEFAULT 'classic',
  accent_color text,
  footer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotations_business ON public.quotations(business_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_valid_until ON public.quotations(valid_until);
CREATE UNIQUE INDEX idx_quotations_number_business ON public.quotations(business_id, quotation_number);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD quotations of own businesses"
  ON public.quotations
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

-- Public can view non-draft quotations (for shared link)
CREATE POLICY "Public can view sent quotations by id"
  ON public.quotations FOR SELECT
  TO anon
  USING (status <> 'draft');

-- =============================================================================
-- 2. QUOTATION ITEMS
-- =============================================================================
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,4) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_quotation_items_quotation ON public.quotation_items(quotation_id);

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD items of own quotations"
  ON public.quotation_items
  FOR ALL
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. QUOTATION VIEWS (track when shared link is opened)
-- =============================================================================
CREATE TABLE public.quotation_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotation_views_quotation ON public.quotation_views(quotation_id);

ALTER TABLE public.quotation_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotation_views of own quotations"
  ON public.quotation_views FOR SELECT
  USING (
    quotation_id IN (
      SELECT q.id FROM public.quotations q
      JOIN public.businesses b ON b.id = q.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anon can insert quotation_views"
  ON public.quotation_views FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- 4. ADD quotation_id TO INVOICES (optional link)
-- =============================================================================
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS quotation_id uuid REFERENCES public.quotations(id) ON DELETE SET NULL;

CREATE INDEX idx_invoices_quotation ON public.invoices(quotation_id);

COMMENT ON COLUMN public.invoices.quotation_id IS 'Optional: invoice created from this quotation.';

-- =============================================================================
-- 5. next_quotation_number FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.next_quotation_number(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(quotation_number, '[^0-9]', '', 'g'), '')::bigint
  ), 0) + 1
  INTO n
  FROM quotations
  WHERE business_id = p_business_id;
  RETURN 'QUO-' || LPAD(n::text, 4, '0');
END;
$$;

-- =============================================================================
-- 6. UPDATED_AT TRIGGER
-- =============================================================================
CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
