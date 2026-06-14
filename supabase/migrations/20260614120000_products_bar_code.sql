-- Optional retail barcode for POS scanning (EAN/UPC/Code128 etc.)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS bar_code text;

COMMENT ON COLUMN public.products.bar_code IS
  'Optional scannable barcode (EAN/UPC/Code128). Unique per business when set.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_bar_code
  ON public.products(business_id, bar_code)
  WHERE bar_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_business_bar_code_lookup
  ON public.products(business_id, bar_code)
  WHERE bar_code IS NOT NULL AND is_active = true;
