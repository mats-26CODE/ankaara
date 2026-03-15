-- Public invoice page 404 fix: allow authenticated users to view non-draft invoices
-- (and their items), and to record invoice_views. Previously only anon could.

-- 1. Authenticated can SELECT non-draft invoices (same as anon)
CREATE POLICY "Public can view non-draft invoices (authenticated)"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (status <> 'draft');

-- 2. Anon and authenticated can read invoice_items for non-draft invoices (so public page shows line items)
CREATE POLICY "Public can view items of non-draft invoices (anon)"
  ON public.invoice_items FOR SELECT
  TO anon
  USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE status <> 'draft')
  );

CREATE POLICY "Public can view items of non-draft invoices (authenticated)"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE status <> 'draft')
  );

-- 3. Authenticated can insert invoice_views (public page records view when opened by logged-in user)
CREATE POLICY "Authenticated can insert invoice_views"
  ON public.invoice_views FOR INSERT
  TO authenticated
  WITH CHECK (true);
