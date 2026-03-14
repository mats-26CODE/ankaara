-- Rename invoice-related payment tables for clarity:
--   payments → invoice_payments
--   payment_transactions → invoice_payment_transactions
-- Subscription payments will use separate tables (subscription_payments, etc.).

-- =============================================================================
-- 1. DROP RLS POLICIES
-- =============================================================================
DROP POLICY IF EXISTS "Users can view payments of own invoices" ON public.payments;
DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view transactions of own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service can manage payment_transactions" ON public.payment_transactions;

-- =============================================================================
-- 2. RENAME TABLES
-- =============================================================================
ALTER TABLE public.payments RENAME TO invoice_payments;
ALTER TABLE public.payment_transactions RENAME TO invoice_payment_transactions;

-- =============================================================================
-- 3. RENAME CONSTRAINTS (invoice_payments)
-- =============================================================================
ALTER TABLE public.invoice_payments
  RENAME CONSTRAINT payments_invoice_id_fkey TO invoice_payments_invoice_id_fkey;

-- =============================================================================
-- 4. invoice_payment_transactions: rename column and FK
-- =============================================================================
ALTER TABLE public.invoice_payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_payment_id_fkey;
ALTER TABLE public.invoice_payment_transactions
  RENAME COLUMN payment_id TO invoice_payment_id;
ALTER TABLE public.invoice_payment_transactions
  ADD CONSTRAINT invoice_payment_transactions_invoice_payment_id_fkey
  FOREIGN KEY (invoice_payment_id) REFERENCES public.invoice_payments(id) ON DELETE CASCADE;

-- =============================================================================
-- 5. RENAME INDEXES
-- =============================================================================
ALTER INDEX IF EXISTS idx_payments_invoice RENAME TO idx_invoice_payments_invoice;
ALTER INDEX IF EXISTS idx_payment_transactions_payment RENAME TO idx_invoice_payment_transactions_invoice_payment;

-- =============================================================================
-- 6. RECREATE RLS POLICIES
-- =============================================================================
CREATE POLICY "Users can view invoice_payments of own invoices"
  ON public.invoice_payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage invoice_payments"
  ON public.invoice_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view invoice_payment_transactions of own invoice payments"
  ON public.invoice_payment_transactions FOR SELECT
  USING (
    invoice_payment_id IN (
      SELECT p.id FROM public.invoice_payments p
      JOIN public.invoices i ON i.id = p.invoice_id
      JOIN public.businesses b ON b.id = i.business_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage invoice_payment_transactions"
  ON public.invoice_payment_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.invoice_payments IS 'Payments received against customer invoices (payment link / gateway).';
COMMENT ON TABLE public.invoice_payment_transactions IS 'Raw payment gateway responses for invoice payments.';
