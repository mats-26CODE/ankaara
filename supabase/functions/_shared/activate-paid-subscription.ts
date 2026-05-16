/**
 * Shared activation logic for paid plans. Invoked only from server-side webhooks
 * (Snippe payment confirmed), never from the browser.
 *
 * Security:
 * - verify_jwt = false; auth via SUBSCRIPTION_ACTIVATE_WEBHOOK_SECRET header
 * - Requires payment_reference (idempotent; unique in subscription_payments)
 * - Validates plan_slug matches allowed tier (pro | business)
 * - Uses service role; DB trigger blocks authenticated users from setting paid plans directly
 */
// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

export type ActivatePlanTier = "pro" | "business";

export type ActivatePaidSubscriptionPayload = {
  user_id: string;
  plan_slug: string;
  payment_reference: string;
  amount?: number;
  currency?: string;
  raw_payload?: Record<string, unknown>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const verifyWebhookSecret = (req: Request): boolean => {
  const secret = Deno.env.get("SUBSCRIPTION_ACTIVATE_WEBHOOK_SECRET");
  if (!secret) return false;
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (bearer === secret) return true;
  return (req.headers.get("x-webhook-secret") ?? "") === secret;
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const computeEndDate = (billingInterval: string | null): string | null => {
  const end = new Date();
  if (billingInterval === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else if (billingInterval === "6_month") {
    end.setMonth(end.getMonth() + 6);
  } else if (billingInterval === "yearly") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    return null;
  }
  return end.toISOString();
};

export const handleActivatePaidSubscription = async (
  req: Request,
  allowedTier: ActivatePlanTier,
): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: true, message: "Method not allowed" }, 405);
  }

  if (!verifyWebhookSecret(req)) {
    return json({ error: true, message: "Unauthorized" }, 401);
  }

  let body: ActivatePaidSubscriptionPayload;
  try {
    body = await req.json();
  } catch {
    return json({ error: true, message: "Invalid JSON body" }, 400);
  }

  const { user_id, plan_slug, payment_reference, amount, currency, raw_payload } = body;

  if (!user_id || !isUuid(user_id)) {
    return json({ error: true, message: "Valid user_id is required" }, 400);
  }
  if (!plan_slug || typeof plan_slug !== "string") {
    return json({ error: true, message: "plan_slug is required" }, 400);
  }
  if (!payment_reference || typeof payment_reference !== "string" || !payment_reference.trim()) {
    return json({ error: true, message: "payment_reference is required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: existingPayment } = await supabase
    .from("subscription_payments")
    .select("id, subscription_id, status")
    .eq("provider_reference", payment_reference.trim())
    .maybeSingle();

  if (existingPayment?.status === "success") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, plan, subscription_plan_id, status, end_date")
      .eq("id", existingPayment.subscription_id)
      .maybeSingle();

    return json(
      {
        ok: true,
        idempotent: true,
        message: "Subscription already activated for this payment",
        subscription: sub,
      },
      200,
    );
  }

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, slug, plan_tier, billing_interval, price_amount, price_currency, is_contact_sales")
    .eq("slug", plan_slug)
    .single();

  if (planError || !plan) {
    return json({ error: true, message: "Plan not found" }, 404);
  }

  if (plan.plan_tier !== allowedTier) {
    return json(
      {
        error: true,
        message: `Plan slug must be a ${allowedTier} plan (received tier: ${plan.plan_tier ?? "unknown"})`,
      },
      400,
    );
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user_id).maybeSingle();

  if (!profile) {
    return json({ error: true, message: "User not found" }, 404);
  }

  const endDate = computeEndDate(plan.billing_interval);
  const paidAt = new Date().toISOString();
  const paymentAmount = amount ?? plan.price_amount ?? 0;
  const paymentCurrency = (currency ?? plan.price_currency ?? "TZS").trim();

  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user_id)
    .maybeSingle();

  let subscriptionId: string;

  if (existingSub) {
    const { data: updated, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: plan.slug,
        subscription_plan_id: plan.id,
        status: "active",
        start_date: paidAt,
        end_date: endDate,
      })
      .eq("id", existingSub.id)
      .select("id")
      .single();

    if (updateError || !updated) {
      return json(
        { error: true, message: updateError?.message ?? "Failed to update subscription" },
        500,
      );
    }
    subscriptionId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id,
        plan: plan.slug,
        subscription_plan_id: plan.id,
        status: "active",
        start_date: paidAt,
        end_date: endDate,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return json(
        { error: true, message: insertError?.message ?? "Failed to create subscription" },
        500,
      );
    }
    subscriptionId = inserted.id;
  }

  if (existingPayment) {
    await supabase
      .from("subscription_payments")
      .update({
        subscription_id: subscriptionId,
        amount: paymentAmount,
        currency: paymentCurrency,
        status: "success",
        paid_at: paidAt,
        raw_payload: raw_payload ?? null,
      })
      .eq("id", existingPayment.id);
  } else {
    const { error: payError } = await supabase.from("subscription_payments").insert({
      subscription_id: subscriptionId,
      amount: paymentAmount,
      currency: paymentCurrency,
      status: "success",
      paid_at: paidAt,
      provider_reference: payment_reference.trim(),
      raw_payload: raw_payload ?? null,
    });

    if (payError) {
      if (payError.code === "23505") {
        return json(
          {
            ok: true,
            idempotent: true,
            message: "Payment reference already processed",
            subscription_id: subscriptionId,
          },
          200,
        );
      }
      return json({ error: true, message: payError.message }, 500);
    }
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, subscription_plan_id, status, start_date, end_date")
    .eq("id", subscriptionId)
    .single();

  return json(
    {
      ok: true,
      subscription,
      plan_slug: plan.slug,
      payment_reference: payment_reference.trim(),
    },
    200,
  );
};
