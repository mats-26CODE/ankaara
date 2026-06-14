-- Database webhooks → send-push-notification edge function.
-- Set Edge Function secret PUSH_NOTIFICATION_WEBHOOK_SECRET to match vault secret below.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'push_notification_webhook_secret'
  ) THEN
    PERFORM vault.create_secret(
      '8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94',
      'push_notification_webhook_secret',
      'Auth secret for send-push-notification edge function webhooks'
    );
  END IF;
END $$;

DROP TRIGGER IF EXISTS push_notification_sales ON public.sales;
CREATE TRIGGER push_notification_sales
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94"}',
    '{}',
    '5000'
  );

DROP TRIGGER IF EXISTS push_notification_invoice_views ON public.invoice_views;
CREATE TRIGGER push_notification_invoice_views
  AFTER INSERT ON public.invoice_views
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94"}',
    '{}',
    '5000'
  );

DROP TRIGGER IF EXISTS push_notification_products ON public.products;
CREATE TRIGGER push_notification_products
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94"}',
    '{}',
    '5000'
  );

DROP TRIGGER IF EXISTS push_notification_businesses ON public.businesses;
CREATE TRIGGER push_notification_businesses
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94"}',
    '{}',
    '5000'
  );

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'push-document-reminders',
  'push-subscription-reminders',
  'push-free-plan-upsell'
);

SELECT cron.schedule(
  'push-document-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"document_reminders"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'push-subscription-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"subscription_reminders"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'push-free-plan-upsell',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"free_plan_upsell"}'::jsonb
  );
  $$
);
