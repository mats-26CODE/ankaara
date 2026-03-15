-- Fix infinite recursion: anon SELECT on invoices was evaluating "Users can CRUD
-- invoices of own businesses" (role public), which queries businesses, and businesses
-- policy "Anon can read businesses of public invoices" queries invoices -> recursion.
-- Restrict the CRUD policy to authenticated only so anon only uses the anon policies.
DROP POLICY IF EXISTS "Users can CRUD invoices of own businesses" ON public.invoices;

CREATE POLICY "Users can CRUD invoices of own businesses"
  ON public.invoices FOR ALL
  TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
