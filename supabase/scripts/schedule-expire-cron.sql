-- Schedule the expire_stale_documents function to run daily at 00:00 (midnight UTC).
-- Run this in Supabase SQL Editor AFTER enabling pg_cron:
--   Dashboard > Database > Extensions > pg_cron (enable)
--
-- To unschedule: SELECT cron.unschedule('expire-stale-documents');

SELECT cron.schedule(
  'expire-stale-documents',
  '0 0 * * *',
  $$SELECT public.expire_stale_documents()$$
);
