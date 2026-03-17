-- Daily cron: expire quotations past valid_until, mark invoices overdue past due_date.
-- Function is called by pg_cron at 00:00 (midnight UTC) every day.
--
-- SETUP: After enabling pg_cron (Dashboard > Database > Extensions > pg_cron),
-- run this in SQL Editor to schedule:
--
--   SELECT cron.schedule('expire-stale-documents', '0 0 * * *', $$SELECT public.expire_stale_documents()$$);
--

CREATE OR REPLACE FUNCTION public.expire_stale_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quotations: sent/viewed -> expired when valid_until has passed
  UPDATE quotations
  SET status = 'expired', updated_at = now()
  WHERE status IN ('sent', 'viewed')
    AND valid_until IS NOT NULL
    AND valid_until < CURRENT_DATE;

  -- Invoices: sent/viewed -> overdue when due_date has passed
  UPDATE invoices
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('sent', 'viewed')
    AND due_date < CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION public.expire_stale_documents() IS 'Expires quotations past valid_until, marks invoices overdue past due_date. Schedule with pg_cron: 0 0 * * * (daily midnight).';
