-- Add tax_percentage to invoices (e.g. 15 for 15%, 18.5 for 18.5%)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS tax_percentage numeric(5,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.invoices.tax_percentage IS 'Tax rate applied in percent (e.g. 15 for 15%)';
