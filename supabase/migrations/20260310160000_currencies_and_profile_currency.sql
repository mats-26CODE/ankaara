-- =============================================================================
-- CURRENCIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.currencies (
  code text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  decimal_digits smallint NOT NULL DEFAULT 2,
  symbol_position text NOT NULL DEFAULT 'left' CHECK (symbol_position IN ('left', 'right')),
  space_between boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read currencies"
  ON public.currencies FOR SELECT
  USING (true);

CREATE POLICY "Service can manage currencies"
  ON public.currencies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- SEED CURRENCIES
-- =============================================================================
INSERT INTO public.currencies (code, name, symbol, decimal_digits, symbol_position, space_between) VALUES
  ('TZS', 'Tanzanian Shilling', 'TSh', 0, 'left', true),
  ('USD', 'US Dollar', '$', 2, 'left', false),
  ('KES', 'Kenyan Shilling', 'KSh', 0, 'left', true),
  ('UGX', 'Ugandan Shilling', 'USh', 0, 'left', true),
  ('EUR', 'Euro', '€', 2, 'left', false),
  ('GBP', 'British Pound', '£', 2, 'left', false),
  ('ZAR', 'South African Rand', 'R', 2, 'left', true),
  ('RWF', 'Rwandan Franc', 'FRw', 0, 'left', true),
  ('NGN', 'Nigerian Naira', '₦', 2, 'left', false),
  ('GHS', 'Ghanaian Cedi', 'GH₵', 2, 'left', false),
  ('ETB', 'Ethiopian Birr', 'Br', 2, 'left', true),
  ('INR', 'Indian Rupee', '₹', 2, 'left', false)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- ADD preferred_currency TO profiles
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_currency text
  DEFAULT 'TZS'
  REFERENCES public.currencies(code);
