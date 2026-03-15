-- Add discount per line item: amount deducted from (quantity * unit_price). Subtotal = sum of line totals after discount.

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS discount numeric(14,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.invoice_items.discount IS 'Amount deducted from (quantity * unit_price) for this line. total = quantity * unit_price - discount.';
