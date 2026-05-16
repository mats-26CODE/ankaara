/**
 * Activates a paid Pro subscription after payment is confirmed.
 *
 * Call from your payment webhook handler (e.g. Snippe), NOT from the client app.
 *
 * Setup:
 * 1. supabase secrets set SUBSCRIPTION_ACTIVATE_WEBHOOK_SECRET=<long random string>
 * 2. config.toml: verify_jwt = false
 * 3. Webhook POST with header:
 *    Authorization: Bearer <SUBSCRIPTION_ACTIVATE_WEBHOOK_SECRET>
 *    or x-webhook-secret: <same>
 *
 * Body:
 * {
 *   "user_id": "<uuid>",
 *   "plan_slug": "pro-monthly" | "pro-6month" | "pro-yearly",
 *   "payment_reference": "<gateway payment id>",
 *   "amount": 24000,
 *   "currency": "TZS",
 *   "raw_payload": { ...optional webhook body... }
 * }
 */
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleActivatePaidSubscription } from "../_shared/activate-paid-subscription.ts";

Deno.serve((req) => handleActivatePaidSubscription(req, "pro"));
