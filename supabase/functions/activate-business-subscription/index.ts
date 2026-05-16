/**
 * Activates a paid Business subscription after payment is confirmed.
 *
 * Call from your payment webhook handler (e.g. Snippe), NOT from the client app.
 * Same auth and payload shape as activate-pro-subscription; plan_slug must be a
 * business-tier plan (business-monthly, business-6month, business-yearly).
 */
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleActivatePaidSubscription } from "../_shared/activate-paid-subscription.ts";

Deno.serve((req) => handleActivatePaidSubscription(req, "business"));
