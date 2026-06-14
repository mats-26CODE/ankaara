-- Optional pg_cron schedules for push notification batch jobs (send-push-notification edge function).
-- Requires pg_cron + pg_net (or invoke via external scheduler / Supabase cron).
--
-- Example (replace project ref and secret):
-- SELECT cron.schedule(
--   'push-document-reminders',
--   '0 8 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-push-notification',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.push_webhook_secret', true)
--     ),
--     body := '{"mode":"cron","job":"document_reminders"}'::jsonb
--   );
--   $$
-- );

COMMENT ON COLUMN public.profiles.notification_token IS
  'Expo push token for mobile notifications; managed by Ankaara mobile app when user opts in.';
