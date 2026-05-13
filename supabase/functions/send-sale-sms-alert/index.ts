/**
 * Database Webhook target: fires on `public.sales` INSERT (configure in Supabase Dashboard).
 *
 * Setup:
 * 1. Deploy with verify_jwt disabled (see supabase/config.toml).
 * 2. Secrets (Dashboard → Edge Functions → Secrets): SALE_SMS_WEBHOOK_SECRET, APP_PUBLIC_URL,
 *    BEEM_SMS_API_KEY, BEEM_SMS_SECRET_KEY, BEEM_SMS_APP_ID (same Beem vars as send-otp).
 * 3. Database → Webhooks → New: table `sales`, event INSERT only. URL:
 *    https://<project-ref>.supabase.co/functions/v1/send-sale-sms-alert
 * 4. Webhook HTTP header: Authorization: Bearer <same value as SALE_SMS_WEBHOOK_SECRET>
 * 5. Apply migration `sale_short_links` (table + resolve_sale_short_link RPC) so SMS can use /l/{slug}.
 */
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type DbWebhookInsertPayload = {
  type: string;
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

const verifyWebhookSecret = (req: Request): boolean => {
  const secret = Deno.env.get("SALE_SMS_WEBHOOK_SECRET");
  if (!secret) return false;
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (bearer === secret) return true;
  const alt = req.headers.get("x-webhook-secret");
  return alt === secret;
};

const formatAmount = (currency: string, total: number): string => {
  const n = Number(total);
  if (!Number.isFinite(n)) return `${currency} 0`;
  if (Number.isInteger(n)) return `${currency} ${n}`;
  return `${currency} ${n.toFixed(2)}`;
};

const SHORT_SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SHORT_SLUG_LEN = 10;

const randomSaleShortSlug = (): string => {
  const bytes = new Uint8Array(SHORT_SLUG_LEN);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < SHORT_SLUG_LEN; i++) {
    s += SHORT_SLUG_ALPHABET[bytes[i]! % SHORT_SLUG_ALPHABET.length];
  }
  return s;
};

const ensureSaleShortLinkSlug = async (
  supabase: ReturnType<typeof createClient>,
  saleId: string,
): Promise<string | null> => {
  const { data: existing, error: selErr } = await supabase
    .from("sale_short_links")
    .select("slug")
    .eq("sale_id", saleId)
    .maybeSingle();

  if (selErr) {
    console.error("[send-sale-sms-alert] sale_short_links select", selErr);
    return null;
  }
  if (existing?.slug && typeof existing.slug === "string") {
    return existing.slug;
  }

  for (let attempt = 0; attempt < 12; attempt++) {
    const slug = randomSaleShortSlug();
    const { error: insErr } = await supabase.from("sale_short_links").insert({
      sale_id: saleId,
      slug,
    });

    if (!insErr) return slug;

    if (insErr.code === "23505") {
      const { data: again } = await supabase
        .from("sale_short_links")
        .select("slug")
        .eq("sale_id", saleId)
        .maybeSingle();
      if (again?.slug && typeof again.slug === "string") return again.slug;
      continue;
    }

    console.error("[send-sale-sms-alert] sale_short_links insert", insErr);
    return null;
  }

  return null;
};

const sendBeemSmsToRecipients = async (
  recipients: { recipient_id: number; dest_addr: string }[],
  message: string,
): Promise<void> => {
  const apiKey = Deno.env.get("BEEM_SMS_API_KEY");
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY");
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  if (!apiKey || !secretKey || !sourceAddress) {
    throw new Error("Beem configuration incomplete");
  }
  const smsAuth = "Basic " + btoa(`${apiKey}:${secretKey}`);
  const body = {
    source_addr: sourceAddress,
    schedule_time: "",
    encoding: "0",
    message,
    recipients,
  };
  const response = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: smsAuth },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.successful === false) {
    throw new Error(data?.data?.message || data?.message || `SMS failed: ${response.status}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, x-webhook-secret",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  if (!verifyWebhookSecret(req)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: DbWebhookInsertPayload;
  try {
    payload = (await req.json()) as DbWebhookInsertPayload;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "sales" || !payload.record) {
    return Response.json({ skipped: true, reason: "not_sales_insert" }, { status: 200 });
  }

  const record = payload.record as {
    id: string;
    business_id: string;
    sale_number: string;
    currency: string;
    total: number | string;
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[send-sale-sms-alert] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return Response.json({ message: "Server misconfigured" }, { status: 500 });
  }

  const appBase = (Deno.env.get("APP_PUBLIC_URL") ?? "").replace(/\/$/, "");
  if (!appBase) {
    console.error("[send-sale-sms-alert] APP_PUBLIC_URL not set");
    return Response.json({ message: "APP_PUBLIC_URL not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, phone, second_phone, send_sale_alert")
    .eq("id", record.business_id)
    .maybeSingle();

  if (bizErr || !business) {
    console.error("[send-sale-sms-alert] Business load error", bizErr);
    return Response.json({ message: "Business not found" }, { status: 404 });
  }

  if (!business.send_sale_alert) {
    return Response.json({ skipped: true, reason: "send_sale_alert_disabled" }, { status: 200 });
  }

  const phones: string[] = [];
  const p1 = typeof business.phone === "string" ? business.phone.trim() : "";
  const p2 = typeof business.second_phone === "string" ? business.second_phone.trim() : "";
  if (p1) phones.push(p1);
  if (p2 && p2 !== p1) phones.push(p2);

  if (phones.length === 0) {
    return Response.json({ skipped: true, reason: "no_phone" }, { status: 200 });
  }

  const beemConfigured = !!(
    Deno.env.get("BEEM_SMS_API_KEY") &&
    Deno.env.get("BEEM_SMS_SECRET_KEY") &&
    Deno.env.get("BEEM_SMS_APP_ID")
  );
  if (!beemConfigured) {
    console.warn("[send-sale-sms-alert] Beem not configured");
    return Response.json({ skipped: true, reason: "beem_not_configured" }, { status: 200 });
  }

  const amount = formatAmount(String(record.currency ?? "TZS"), Number(record.total));
  const shortSlug = await ensureSaleShortLinkSlug(supabase, record.id);
  if (!shortSlug) {
    console.error("[send-sale-sms-alert] Could not create short link for sale", record.id);
    return Response.json({ message: "Short link unavailable" }, { status: 500 });
  }
  const link = `${appBase}/l/${shortSlug}`;
  const businessName =
    typeof business.name === "string" && business.name.trim().length > 0
      ? business.name.trim()
      : "Your business";
  const message = `${businessName} has recorded a sale ${record.sale_number} of ${amount}. Please visit the link to view it ${link}`;

  const recipients = phones
    .map((addr, i) => ({
      recipient_id: i + 1,
      dest_addr: addr.replace(/\D/g, ""),
    }))
    .filter((r) => r.dest_addr.length > 0)
    .map((r, i) => ({ ...r, recipient_id: i + 1 }));

  if (recipients.length === 0) {
    return Response.json({ skipped: true, reason: "no_valid_phone" }, { status: 200 });
  }

  try {
    await sendBeemSmsToRecipients(recipients, message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-sale-sms-alert] Beem send error", msg);
    return Response.json({ message: "SMS delivery failed", error: msg }, { status: 502 });
  }

  return Response.json({
    ok: true,
    recipientCount: recipients.length,
  });
});
