-- Rename organization_id to business_id across tables (clients, invoices, invoice_templates, subscriptions)
-- and update RLS policies, function next_invoice_number, indexes, and constraint names.

-- =============================================================================
-- 1. DROP RLS POLICIES that reference organization_id
-- =============================================================================
DROP POLICY IF EXISTS "Users can CRUD clients of own businesses" ON public.clients;
DROP POLICY IF EXISTS "Users can CRUD invoices of own businesses" ON public.invoices;
DROP POLICY IF EXISTS "Public can view sent invoices by id" ON public.invoices;
DROP POLICY IF EXISTS "Users can CRUD items of own invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can view payments of own invoices" ON public.payments;
DROP POLICY IF EXISTS "Users can view transactions of own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view invoice_views of own invoices" ON public.invoice_views;
DROP POLICY IF EXISTS "Users can CRUD templates of own businesses" ON public.invoice_templates;
DROP POLICY IF EXISTS "Users can CRUD subscriptions of own businesses" ON public.subscriptions;

-- =============================================================================
-- 2. RENAME COLUMNS
-- =============================================================================
ALTER TABLE public.clients RENAME COLUMN organization_id TO business_id;
ALTER TABLE public.invoices RENAME COLUMN organization_id TO business_id;
ALTER TABLE public.invoice_templates RENAME COLUMN organization_id TO business_id;
ALTER TABLE public.subscriptions RENAME COLUMN organization_id TO business_id;

-- =============================================================================
-- 3. RENAME CONSTRAINTS (optional but consistent naming)
-- =============================================================================
ALTER TABLE public.clients RENAME CONSTRAINT clients_organization_id_fkey TO clients_business_id_fkey;
ALTER TABLE public.invoices RENAME CONSTRAINT invoices_organization_id_fkey TO invoices_business_id_fkey;
ALTER TABLE public.invoice_templates RENAME CONSTRAINT invoice_templates_organization_id_fkey TO invoice_templates_business_id_fkey;
ALTER TABLE public.subscriptions RENAME CONSTRAINT subscriptions_organization_id_fkey TO subscriptions_business_id_fkey;

-- =============================================================================
-- 4. RENAME INDEXES
-- =============================================================================
ALTER INDEX IF EXISTS idx_clients_organization RENAME TO idx_clients_business;
ALTER INDEX IF EXISTS idx_invoices_organization RENAME TO idx_invoices_business;
ALTER INDEX IF EXISTS idx_invoices_number_org RENAME TO idx_invoices_number_business;
ALTER INDEX IF EXISTS idx_invoice_templates_organization RENAME TO idx_invoice_templates_business;
ALTER INDEX IF EXISTS idx_subscriptions_organization RENAME TO idx_subscriptions_business;

-- =============================================================================
-- 5. REPLACE FUNCTION next_invoice_number
-- =============================================================================
DROP FUNCTION IF EXISTS public.next_invoice_number(uuid);
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_business_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(invoice_number, '[^0-9]', '', 'g'), '')::bigint
  ), 0) + 1
  INTO n
  FROM invoices
  WHERE business_id = p_business_id;
  RETURN 'INV-' || LPAD(n::text, 4, '0');
END;
$$;

-- =============================================================================
-- 6. RECREATE RLS POLICIES (using business_id)
-- =============================================================================
CREATE POLICY "Users can CRUD clients of own businesses"
  ON public.clients FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can CRUD invoices of own businesses"
  ON public.invoices FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view sent invoices by id"
  ON public.invoices FOR SELECT TO anon
  USING (status <> 'draft');

CREATE POLICY "Users can CRUD items of own invoices"
  ON public.invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view payments of own invoices"
  ON public.payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view transactions of own payments"
  ON public.payment_transactions FOR SELECT
  USING (
    payment_id IN (
      SELECT p.id FROM public.payments p
      JOIN public.invoices i ON i.id = p.invoice_id
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invoice_views of own invoices"
  ON public.invoice_views FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can CRUD templates of own businesses"
  ON public.invoice_templates FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can CRUD subscriptions of own businesses"
  ON public.subscriptions FOR ALL
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
