-- Link invoice_items to products: each line item references a product.
-- description/unit_price remain as snapshot at time of invoice; product_id is the source.

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON public.invoice_items(product_id);

COMMENT ON COLUMN public.invoice_items.product_id IS 'Product this line was created from; null for legacy rows. description/unit_price are snapshot.';
