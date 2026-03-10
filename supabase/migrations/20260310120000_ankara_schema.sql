-- Ankara – Full schema (profiles, businesses, clients, invoices, payments, etc.)
-- Run with: supabase db push (or apply via Dashboard SQL editor)

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 2. BUSINESSES
-- =============================================================================
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  brand_color text,
  currency text NOT NULL DEFAULT 'TZS',
  address text,
  tax_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own businesses"
  ON public.businesses
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================================================
-- 3. CLIENTS
-- =============================================================================
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_organization ON public.clients(organization_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD clients of own businesses"
  ON public.clients
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. INVOICES
-- =============================================================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled')),
  issue_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  tax numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  payment_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE UNIQUE INDEX idx_invoices_number_org ON public.invoices(organization_id, invoice_number);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD invoices of own businesses"
  ON public.invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- Public invoice view: anon can read non-draft invoices (for shared link)
CREATE POLICY "Public can view sent invoices by id"
  ON public.invoices FOR SELECT
  TO anon
  USING (status <> 'draft');

-- =============================================================================
-- 5. INVOICE ITEMS
-- =============================================================================
CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(14,4) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD items of own invoices"
  ON public.invoice_items
  FOR ALL
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.organization_id
      WHERE b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.organization_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 6. PAYMENTS
-- =============================================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_provider text NOT NULL DEFAULT 'snippe',
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  paid_at timestamptz,
  reference text
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments of own invoices"
  ON public.payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.organization_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Service role / edge function will INSERT/UPDATE payments (webhook)
CREATE POLICY "Service can manage payments"
  ON public.payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 7. PAYMENT TRANSACTIONS (raw gateway responses)
-- =============================================================================
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  provider_transaction_id text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_payment ON public.payment_transactions(payment_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions of own payments"
  ON public.payment_transactions FOR SELECT
  USING (
    payment_id IN (
      SELECT p.id FROM public.payments p
      JOIN public.invoices i ON i.id = p.invoice_id
      JOIN public.businesses b ON b.id = i.organization_id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage payment_transactions"
  ON public.payment_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 8. INVOICE VIEWS (track when invoice link is opened)
-- =============================================================================
CREATE TABLE public.invoice_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_views_invoice ON public.invoice_views(invoice_id);

ALTER TABLE public.invoice_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice_views of own invoices"
  ON public.invoice_views FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.businesses b ON b.id = i.organization_id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Anon can insert (public invoice page records view)
CREATE POLICY "Anon can insert invoice_views"
  ON public.invoice_views FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- 9. INVOICE TEMPLATES
-- =============================================================================
CREATE TABLE public.invoice_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  layout jsonb,
  is_default boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_invoice_templates_organization ON public.invoice_templates(organization_id);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD templates of own businesses"
  ON public.invoice_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- 10. SUBSCRIPTIONS
-- =============================================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free','pro','business')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz
);

CREATE INDEX idx_subscriptions_organization ON public.subscriptions(organization_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD subscriptions of own businesses"
  ON public.subscriptions
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================================
-- STORAGE BUCKETS (run in Dashboard or via API)
-- Buckets: logos, invoice_pdfs
-- RLS: allow authenticated users to read/write in their org folders if needed
-- =============================================================================
-- Insert storage buckets via Supabase Dashboard > Storage or use:
-- SELECT storage.create_bucket('logos', public := false);
-- SELECT storage.create_bucket('invoice_pdfs', public := false);

-- =============================================================================
-- HELPER: next invoice number per organization
-- =============================================================================
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_organization_id uuid)
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
  WHERE organization_id = p_organization_id;
  RETURN 'INV-' || LPAD(n::text, 4, '0');
END;
$$;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
