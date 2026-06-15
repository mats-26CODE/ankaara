-- Push notification extensions: invoice payments, quotation accepted, loan/sales cron jobs.

DROP TRIGGER IF EXISTS push_notification_invoice_payments ON public.invoice_payments;
CREATE TRIGGER push_notification_invoice_payments
  AFTER INSERT OR UPDATE ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94"}',
    '{}',
    '5000'
  );

DROP TRIGGER IF EXISTS push_notification_quotations ON public.quotations;
CREATE TRIGGER push_notification_quotations
  AFTER UPDATE ON public.quotations
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
  'push-loan-repayment-reminders',
  'push-sales-summary-daily',
  'push-sales-summary-weekly'
);

SELECT cron.schedule(
  'push-loan-repayment-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"loan_repayment_reminders"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'push-sales-summary-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"sales_summary_daily"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'push-sales-summary-weekly',
  '0 8 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://rtpgpoodjfutanpwhaok.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 8780997f60825d43e6e8a6c3d3519afe273b2480b65224c2f3ebacfe0122be94'
    ),
    body := '{"mode":"cron","job":"sales_summary_weekly"}'::jsonb
  );
  $$
);
