-- Track when an invoice was first viewed via its public link.
-- Used to gate the "invoice viewed" push notification so it fires only once.

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS viewed_at timestamptz;

-- Backfill from the earliest recorded public view so already-viewed invoices never re-notify.
UPDATE public.invoices i
SET viewed_at = v.first_viewed
FROM (
  SELECT invoice_id, min(viewed_at) AS first_viewed
  FROM public.invoice_views
  GROUP BY invoice_id
) v
WHERE v.invoice_id = i.id
  AND i.viewed_at IS NULL;

-- Cover invoices already past the "sent" stage with no recorded view rows.
UPDATE public.invoices
SET viewed_at = COALESCE(viewed_at, updated_at)
WHERE viewed_at IS NULL
  AND status IN ('viewed', 'paid', 'overdue');
