-- SMS alert contacts and opt-in for transactional messages (e.g. sale recorded).
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS second_phone text,
  ADD COLUMN IF NOT EXISTS send_sale_alert boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.businesses.phone IS 'Primary number for transactional SMS (e.g. 2557XXXXXXXX for Beem).';
COMMENT ON COLUMN public.businesses.second_phone IS 'Optional second number for the same alerts.';
COMMENT ON COLUMN public.businesses.send_sale_alert IS 'When true, send SMS when a sale is recorded (requires at least one phone).';
