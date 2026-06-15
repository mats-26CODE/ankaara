/**
 * Push notifications via Expo Push Service.
 *
 * Modes:
 * 1. Database webhook (Supabase Dashboard → Database → Webhooks):
 *    POST with standard `{ type, table, record, old_record }` payload.
 *    Supported tables: sales (INSERT), invoice_views (INSERT), products (UPDATE),
 *    businesses (INSERT), invoice_payments (INSERT/UPDATE), quotations (UPDATE).
 *
 * 2. Cron / manual dispatch:
 *    POST `{ "mode": "cron", "job": "document_reminders" | "subscription_reminders" | "free_plan_upsell" | "loan_repayment_reminders" | "sales_summary_daily" | "sales_summary_weekly" }`
 *
 * Setup:
 * - Deploy with verify_jwt disabled (supabase/config.toml).
 * - Secrets: PUSH_NOTIFICATION_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   optional EXPO_NOTIFICATIONS_ACCESS_TOKEN, APP_PUBLIC_URL (for deep links in copy).
 * - Webhook header: Authorization: Bearer <PUSH_NOTIFICATION_WEBHOOK_SECRET>
 */
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createServiceSupabase,
  getFirstName,
  parseMoney,
  sendExpoPushToUser,
  verifyPushWebhookSecret,
} from "../_shared/expo-push.ts";
import { mobilePushRoutes } from "../_shared/mobile-push-routes.ts";
import { formatMoneyAmountForSms } from "../_shared/format-money-amount-for-sms.ts";

type DbWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

type CronPayload = {
  mode: "cron";
  job:
    | "document_reminders"
    | "subscription_reminders"
    | "free_plan_upsell"
    | "loan_repayment_reminders"
    | "sales_summary_daily"
    | "sales_summary_weekly";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const formatAmount = (currency: string, total: number): string =>
  formatMoneyAmountForSms(Number(total), currency);

const buildSalePushCopy = (opts: {
  lang: "en" | "sw";
  saleNumber: string;
  currency: string;
  total: number;
  profit: number;
  firstName: string;
}): { title: string; body: string } => {
  const saleAmt = formatAmount(opts.currency, opts.total);
  const profitAmt = formatAmount(opts.currency, opts.profit);
  const id = opts.saleNumber.trim() || "—";
  const name = opts.firstName || "there";

  if (opts.lang === "en") {
    return {
      title: "New sale recorded",
      body: `Hi ${name}, sale ${id} for ${saleAmt} (profit ${profitAmt}) was recorded.`,
    };
  }

  return {
    title: "Mauzo mapya yamerekodiwa",
    body: `Habari ${name}, mauzo ${id} ya ${saleAmt} (faida ${profitAmt}) yamerekodiwa.`,
  };
};

const handleSaleInsert = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
) => {
  const businessId = String(record.business_id ?? "");
  if (!businessId) return { skipped: true, reason: "missing_business_id" };

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name, owner_id, send_sale_alert")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr || !business) {
    console.error("[send-push-notification] business load", bizErr);
    return { skipped: true, reason: "business_not_found" };
  }

  if (!business.send_sale_alert) {
    return { skipped: true, reason: "send_sale_alert_disabled" };
  }

  const ownerId = typeof business.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const saleId = String(record.id ?? "");
  const { data: saleRow } = await supabase
    .from("sales")
    .select("total, profit, currency, sale_number")
    .eq("id", saleId)
    .maybeSingle();

  const currency = String(saleRow?.currency ?? record.currency ?? "TZS");
  const totalNum = parseMoney(saleRow?.total ?? record.total);
  const profitNum = parseMoney(saleRow?.profit ?? record.profit ?? 0);
  const saleNumber = String(saleRow?.sale_number ?? record.sale_number ?? "");

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const lang = profile.preferred_language === "en" ? "en" : "sw";
    const copy = buildSalePushCopy({
      lang,
      saleNumber,
      currency,
      total: totalNum,
      profit: profitNum,
      firstName: getFirstName(profile.full_name),
    });

    return {
      title: copy.title,
      body: copy.body,
      notificationType: "sale",
      businessId,
      data: { url: mobilePushRoutes.saleDetail(saleId) },
    };
  });
};

const handleInvoiceViewInsert = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
) => {
  const invoiceId = String(record.invoice_id ?? "");
  if (!invoiceId) return { skipped: true, reason: "missing_invoice_id" };

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, business_id, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr || !invoice) {
    console.error("[send-push-notification] invoice load", invErr);
    return { skipped: true, reason: "invoice_not_found" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", invoice.business_id)
    .maybeSingle();

  const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const invoiceNumber = String(invoice.invoice_number ?? "Invoice");

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: "Invoice viewed",
        body: `${firstName ? `Hi ${firstName}, ` : ""}${invoiceNumber} was opened by your client.`,
        notificationType: "invoice_view",
        businessId: invoice.business_id,
        data: { url: mobilePushRoutes.invoiceDetail(invoiceId) },
      };
    }

    return {
      title: "Invoice imefunguliwa",
      body: `${firstName ? `Habari ${firstName}, ` : ""}${invoiceNumber} imefunguliwa na mteja wako.`,
      notificationType: "invoice_view",
      businessId: invoice.business_id,
      data: { url: mobilePushRoutes.invoiceDetail(invoiceId) },
    };
  });
};

const isLowStock = (stock: unknown, threshold: unknown): boolean => {
  const s = parseMoney(stock);
  const t = parseMoney(threshold);
  if (t <= 0) return false;
  return s <= t;
};

const handleProductUpdate = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
) => {
  const productId = String(record.id ?? "");
  const businessId = String(record.business_id ?? "");
  if (!productId || !businessId) return { skipped: true, reason: "missing_ids" };

  const itemType = String(record.item_type ?? "product");
  if (itemType === "service") return { skipped: true, reason: "service_item" };

  const wasLow = oldRecord
    ? isLowStock(oldRecord.stock_quantity, oldRecord.low_stock_threshold)
    : false;
  const isNowLow = isLowStock(record.stock_quantity, record.low_stock_threshold);

  if (!isNowLow || wasLow) {
    return { skipped: true, reason: "not_newly_low_stock" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();

  const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const productName = String(record.name ?? "Product");
  const stockQty = parseMoney(record.stock_quantity);
  const threshold = parseMoney(record.low_stock_threshold);

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: "Low stock alert",
        body: `${firstName ? `${firstName}, ` : ""}${productName} is low (${stockQty} left, alert at ${threshold}).`,
        notificationType: "low_stock",
        businessId,
        data: { url: mobilePushRoutes.productStockHistory(productId) },
      };
    }

    return {
      title: "Bidhaa inaisha",
      body: `${firstName ? `${firstName}, ` : ""}${productName} ina akiba ndogo (${stockQty} zimesalia, kiwango ${threshold}).`,
      notificationType: "low_stock",
      businessId,
      data: { url: mobilePushRoutes.productStockHistory(productId) },
    };
  });
};

const handleBusinessInsert = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
) => {
  const ownerId = String(record.owner_id ?? "");
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const businessName = String(record.name ?? "your business");

  const businessId = String(record.id ?? "");

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: "Business ready",
        body: `${firstName ? `Hi ${firstName}, ` : ""}${businessName} is set up. Start selling from Ankaara.`,
        notificationType: "business_created",
        businessId,
        data: { url: mobilePushRoutes.business() },
      };
    }

    return {
      title: "Biashara iko tayari",
      body: `${firstName ? `Habari ${firstName}, ` : ""}${businessName} imewekwa. Anza kuuza na Ankaara.`,
      notificationType: "business_created",
      businessId,
      data: { url: mobilePushRoutes.business() },
    };
  });
};

const handleInvoicePayment = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
) => {
  const status = String(record.status ?? "");
  if (status !== "success") return { skipped: true, reason: "not_success" };

  if (oldRecord && String(oldRecord.status ?? "") === "success") {
    return { skipped: true, reason: "already_success" };
  }

  const invoiceId = String(record.invoice_id ?? "");
  if (!invoiceId) return { skipped: true, reason: "missing_invoice_id" };

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, business_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr || !invoice) {
    console.error("[send-push-notification] invoice payment invoice load", invErr);
    return { skipped: true, reason: "invoice_not_found" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", invoice.business_id)
    .maybeSingle();

  const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const invoiceNumber = String(invoice.invoice_number ?? "Invoice");
  const amount = parseMoney(record.amount);
  const currency = String(record.currency ?? "TZS");
  const amountLabel = formatAmount(currency, amount);
  const paymentId = String(record.id ?? "");

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: "Payment received",
        body: `${firstName ? `${firstName}, ` : ""}${amountLabel} received for ${invoiceNumber}.`,
        notificationType: "invoice_payment",
        businessId: invoice.business_id,
        data: { url: mobilePushRoutes.invoiceDetail(invoiceId), paymentId },
      };
    }

    return {
      title: "Malipo yamepokelewa",
      body: `${firstName ? `${firstName}, ` : ""}${amountLabel} yamepokelewa kwa ${invoiceNumber}.`,
      notificationType: "invoice_payment",
      businessId: invoice.business_id,
      data: { url: mobilePushRoutes.invoiceDetail(invoiceId), paymentId },
    };
  });
};

const handleQuotationUpdate = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
) => {
  const newStatus = String(record.status ?? "");
  const oldStatus = oldRecord ? String(oldRecord.status ?? "") : "";

  if (newStatus !== "accepted" || oldStatus === "accepted") {
    return { skipped: true, reason: "not_newly_accepted" };
  }

  const quotationId = String(record.id ?? "");
  const businessId = String(record.business_id ?? "");
  if (!quotationId || !businessId) return { skipped: true, reason: "missing_ids" };

  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();

  const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return { skipped: true, reason: "missing_owner" };

  const quotationNumber = String(record.quotation_number ?? "Quotation");
  const clientId = typeof record.client_id === "string" ? record.client_id : null;

  let clientName = "Your client";
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    if (client?.name) clientName = String(client.name);
  }

  return sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: "Quotation accepted",
        body: `${firstName ? `${firstName}, ` : ""}${clientName} accepted ${quotationNumber}.`,
        notificationType: "quotation_accepted",
        businessId,
        data: { url: mobilePushRoutes.quotationDetail(quotationId) },
      };
    }

    return {
      title: "Quotation imekubaliwa",
      body: `${firstName ? `${firstName}, ` : ""}${clientName} amekubali ${quotationNumber}.`,
      notificationType: "quotation_accepted",
      businessId,
      data: { url: mobilePushRoutes.quotationDetail(quotationId) },
    };
  });
};

const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

type SalesAggregate = {
  count: number;
  total: number;
  profit: number;
  currency: string;
};

const aggregateSalesByBusiness = (
  rows: Array<{
    business_id: string;
    total: unknown;
    profit: unknown;
    currency: string;
  }>,
): Map<string, SalesAggregate> => {
  const map = new Map<string, SalesAggregate>();

  for (const row of rows) {
    const businessId = String(row.business_id ?? "");
    if (!businessId) continue;

    const existing = map.get(businessId) ?? {
      count: 0,
      total: 0,
      profit: 0,
      currency: String(row.currency ?? "TZS"),
    };

    existing.count += 1;
    existing.total += parseMoney(row.total);
    existing.profit += parseMoney(row.profit);
    map.set(businessId, existing);
  }

  return map;
};

const notifyOwnerSalesSummary = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  businessId: string,
  agg: SalesAggregate,
  periodLabel: { en: string; sw: string },
  notificationType: string,
) => {
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id, name")
    .eq("id", businessId)
    .maybeSingle();

  const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
  if (!ownerId) return false;

  const businessName = String(business?.name ?? "your business");
  const totalLabel = formatAmount(agg.currency, agg.total);
  const profitLabel = formatAmount(agg.currency, agg.profit);

  const result = await sendExpoPushToUser(supabase, ownerId, (profile) => {
    const firstName = getFirstName(profile.full_name);
    const lang = profile.preferred_language === "en" ? "en" : "sw";

    if (lang === "en") {
      return {
        title: periodLabel.en,
        body: `${firstName ? `${firstName}, ` : ""}${businessName}: ${agg.count} sale${agg.count === 1 ? "" : "s"}, ${totalLabel} total (profit ${profitLabel}).`,
        notificationType,
        businessId,
        data: { url: mobilePushRoutes.sales() },
      };
    }

    return {
      title: periodLabel.sw,
      body: `${firstName ? `${firstName}, ` : ""}${businessName}: mauzo ${agg.count}, jumla ${totalLabel} (faida ${profitLabel}).`,
      notificationType,
      businessId,
      data: { url: mobilePushRoutes.sales() },
    };
  });

  return result.sent;
};

const runDocumentReminders = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const today = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const dueDate = inThreeDays.toISOString().slice(0, 10);

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, due_date, business_id, status")
    .in("status", ["sent", "viewed"])
    .eq("due_date", dueDate);

  if (error) {
    console.error("[send-push-notification] document reminders", error);
    return { error: error.message };
  }

  let sent = 0;
  for (const invoice of invoices ?? []) {
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", invoice.business_id)
      .maybeSingle();

    const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
    if (!ownerId) continue;

    const result = await sendExpoPushToUser(supabase, ownerId, (profile) => {
      const lang = profile.preferred_language === "en" ? "en" : "sw";
      const number = String(invoice.invoice_number ?? "Invoice");
      const firstName = getFirstName(profile.full_name);

      if (lang === "en") {
        return {
          title: "Invoice due soon",
          body: `${firstName ? `${firstName}, ` : ""}${number} is due in 3 days.`,
          notificationType: "invoice_due",
          businessId: invoice.business_id,
          data: { url: mobilePushRoutes.invoiceDetail(String(invoice.id)) },
        };
      }

      return {
        title: "Invoice inakaribia muda",
        body: `${firstName ? `${firstName}, ` : ""}${number} ina muda wa siku 3.`,
        notificationType: "invoice_due",
        businessId: invoice.business_id,
        data: { url: mobilePushRoutes.invoiceDetail(String(invoice.id)) },
      };
    });

    if (result.sent) sent += 1;
  }

  const { data: quotations, error: quoteErr } = await supabase
    .from("quotations")
    .select("id, quotation_number, valid_until, business_id, status")
    .in("status", ["sent", "viewed"])
    .eq("valid_until", dueDate);

  if (quoteErr) {
    console.error("[send-push-notification] quotation reminders", quoteErr);
  } else {
    for (const quotation of quotations ?? []) {
      const { data: business } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", quotation.business_id)
        .maybeSingle();

      const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
      if (!ownerId) continue;

      const result = await sendExpoPushToUser(supabase, ownerId, (profile) => {
        const lang = profile.preferred_language === "en" ? "en" : "sw";
        const number = String(quotation.quotation_number ?? "Quotation");
        const firstName = getFirstName(profile.full_name);

        if (lang === "en") {
          return {
            title: "Quotation expiring soon",
            body: `${firstName ? `${firstName}, ` : ""}${number} expires in 3 days.`,
            notificationType: "quotation_due",
            businessId: quotation.business_id,
            data: { url: mobilePushRoutes.quotationDetail(String(quotation.id)) },
          };
        }

        return {
          title: "Quotation inakaribia kuisha",
          body: `${firstName ? `${firstName}, ` : ""}${number} inaisha siku 3.`,
          notificationType: "quotation_due",
          businessId: quotation.business_id,
          data: { url: mobilePushRoutes.quotationDetail(String(quotation.id)) },
        };
      });

      if (result.sent) sent += 1;
    }
  }

  return { job: "document_reminders", sent };
};

const runSubscriptionReminders = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);
  const targetDate = inSevenDays.toISOString().slice(0, 10);

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan, end_date, status")
    .eq("status", "active")
    .not("end_date", "is", null)
    .eq("end_date", targetDate);

  if (error) {
    console.error("[send-push-notification] subscription reminders", error);
    return { error: error.message };
  }

  let sent = 0;
  for (const sub of subscriptions ?? []) {
    const userId = String(sub.user_id ?? "");
    if (!userId) continue;

    const result = await sendExpoPushToUser(supabase, userId, (profile) => {
      const lang = profile.preferred_language === "en" ? "en" : "sw";
      const firstName = getFirstName(profile.full_name);
      const plan = String(sub.plan ?? "plan");

      if (lang === "en") {
        return {
          title: "Plan expiring soon",
          body: `${firstName ? `${firstName}, ` : ""}your ${plan} plan expires in 7 days. Renew to keep premium features.`,
          notificationType: "subscription_reminder",
          data: { url: mobilePushRoutes.subscribe() },
        };
      }

      return {
        title: "Mpango unakaribia kuisha",
        body: `${firstName ? `${firstName}, ` : ""}mpango wako wa ${plan} unaisha siku 7. Endelea ili kubaki na vipengele vya premium.`,
        notificationType: "subscription_reminder",
        data: { url: mobilePushRoutes.subscribe() },
      };
    });

    if (result.sent) sent += 1;
  }

  return { job: "subscription_reminders", sent };
};

const runFreePlanUpsell = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const { data: freePlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  if (!freePlan?.id) return { job: "free_plan_upsell", sent: 0 };

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("subscription_plan_id", freePlan.id)
    .eq("status", "active");

  if (error) {
    console.error("[send-push-notification] free plan upsell", error);
    return { error: error.message };
  }

  let sent = 0;
  for (const sub of subscriptions ?? []) {
    const userId = String(sub.user_id ?? "");
    if (!userId) continue;

    const result = await sendExpoPushToUser(supabase, userId, (profile) => {
      const lang = profile.preferred_language === "en" ? "en" : "sw";
      const firstName = getFirstName(profile.full_name);

      if (lang === "en") {
        return {
          title: "Unlock more with Pro Plan",
          body: `${firstName ? `${firstName}, ` : ""}upgrade to Pro or Business for higher limits, quotations, and more.`,
          notificationType: "plan_upsell",
          data: { url: mobilePushRoutes.subscribe() },
        };
      }

      return {
        title: "Enjoy zaidi na Pro Plan",
        body: `${firstName ? `${firstName}, ` : ""}panda hadi Pro au Business kwa mipaka zaidi, quotations, na zaidi.`,
        notificationType: "plan_upsell",
        data: { url: mobilePushRoutes.subscribe() },
      };
    });

    if (result.sent) sent += 1;
  }

  return { job: "free_plan_upsell", sent };
};

const runLoanRepaymentReminders = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const today = new Date();
  const inThreeDays = new Date(today);
  inThreeDays.setDate(today.getDate() + 3);
  const dueDate = toDateString(inThreeDays);

  const { data: dueInvoices, error: invoiceErr } = await supabase
    .from("invoices")
    .select("id")
    .eq("due_date", dueDate);

  if (invoiceErr) {
    console.error("[send-push-notification] loan repayment invoice lookup", invoiceErr);
    return { error: invoiceErr.message };
  }

  const invoiceIds = (dueInvoices ?? [])
    .map((row) => String(row.id ?? ""))
    .filter((id) => id.length > 0);

  if (invoiceIds.length === 0) {
    return { job: "loan_repayment_reminders", sent: 0 };
  }

  const { data: loans, error } = await supabase
    .from("loans")
    .select(
      "id, loan_number, business_id, outstanding_balance, currency, status, invoice_id, clients(name)",
    )
    .in("invoice_id", invoiceIds)
    .in("status", ["open", "partially_paid"])
    .gt("outstanding_balance", 0);

  if (error) {
    console.error("[send-push-notification] loan repayment reminders", error);
    return { error: error.message };
  }

  let sent = 0;
  for (const loan of loans ?? []) {
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", loan.business_id)
      .maybeSingle();

    const ownerId = typeof business?.owner_id === "string" ? business.owner_id : "";
    if (!ownerId) continue;

    const loanNumber = String(loan.loan_number ?? "Loan");
    const balance = parseMoney(loan.outstanding_balance);
    const currency = String(loan.currency ?? "TZS");
    const balanceLabel = formatAmount(currency, balance);
    const loanId = String(loan.id ?? "");
    const clientName =
      loan.clients && typeof loan.clients === "object" && "name" in loan.clients
        ? String((loan.clients as { name?: string }).name ?? "")
        : "";

    const result = await sendExpoPushToUser(supabase, ownerId, (profile) => {
      const firstName = getFirstName(profile.full_name);
      const lang = profile.preferred_language === "en" ? "en" : "sw";

      if (lang === "en") {
        return {
          title: "Loan repayment due soon",
          body: `${firstName ? `${firstName}, ` : ""}${loanNumber}${clientName ? ` (${clientName})` : ""} — ${balanceLabel} due in 3 days.`,
          notificationType: "loan_due",
          businessId: loan.business_id,
          data: { url: mobilePushRoutes.loanDetail(loanId) },
        };
      }

      return {
        title: "Mkopo unakaribia muda",
        body: `${firstName ? `${firstName}, ` : ""}${loanNumber}${clientName ? ` (${clientName})` : ""} — ${balanceLabel} ina muda wa siku 3.`,
        notificationType: "loan_due",
        businessId: loan.business_id,
        data: { url: mobilePushRoutes.loanDetail(loanId) },
      };
    });

    if (result.sent) sent += 1;
  }

  return { job: "loan_repayment_reminders", sent };
};

const runSalesSummaryDaily = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const saleDate = toDateString(yesterday);

  const { data: sales, error } = await supabase
    .from("sales")
    .select("business_id, total, profit, currency")
    .eq("sale_date", saleDate);

  if (error) {
    console.error("[send-push-notification] sales summary daily", error);
    return { error: error.message };
  }

  const aggregates = aggregateSalesByBusiness(sales ?? []);
  let sent = 0;

  for (const [businessId, agg] of aggregates) {
    const didSend = await notifyOwnerSalesSummary(
      supabase,
      businessId,
      agg,
      { en: "Yesterday's sales", sw: "Mauzo ya jana" },
      "sales_summary_daily",
    );
    if (didSend) sent += 1;
  }

  return { job: "sales_summary_daily", saleDate, sent };
};

const runSalesSummaryWeekly = async (supabase: ReturnType<typeof createServiceSupabase>) => {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() - 1);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const startDate = toDateString(start);
  const endDate = toDateString(end);

  const { data: sales, error } = await supabase
    .from("sales")
    .select("business_id, total, profit, currency")
    .gte("sale_date", startDate)
    .lte("sale_date", endDate);

  if (error) {
    console.error("[send-push-notification] sales summary weekly", error);
    return { error: error.message };
  }

  const aggregates = aggregateSalesByBusiness(sales ?? []);
  let sent = 0;

  for (const [businessId, agg] of aggregates) {
    const didSend = await notifyOwnerSalesSummary(
      supabase,
      businessId,
      agg,
      { en: "Weekly sales summary", sw: "Muhtasari wa mauzo ya wiki" },
      "sales_summary_weekly",
    );
    if (didSend) sent += 1;
  }

  return { job: "sales_summary_weekly", startDate, endDate, sent };
};

const handleCronJob = async (
  supabase: ReturnType<typeof createServiceSupabase>,
  job: CronPayload["job"],
) => {
  switch (job) {
    case "document_reminders":
      return runDocumentReminders(supabase);
    case "subscription_reminders":
      return runSubscriptionReminders(supabase);
    case "free_plan_upsell":
      return runFreePlanUpsell(supabase);
    case "loan_repayment_reminders":
      return runLoanRepaymentReminders(supabase);
    case "sales_summary_daily":
      return runSalesSummaryDaily(supabase);
    case "sales_summary_weekly":
      return runSalesSummaryWeekly(supabase);
    default:
      return { skipped: true, reason: "unknown_cron_job" };
  }
};

const handleDbWebhook = async (payload: DbWebhookPayload) => {
  const supabase = createServiceSupabase();

  if (!payload.record) {
    return { skipped: true, reason: "missing_record" };
  }

  if (payload.table === "sales" && payload.type === "INSERT") {
    return handleSaleInsert(supabase, payload.record);
  }

  if (payload.table === "invoice_views" && payload.type === "INSERT") {
    return handleInvoiceViewInsert(supabase, payload.record);
  }

  if (payload.table === "products" && payload.type === "UPDATE") {
    return handleProductUpdate(supabase, payload.record, payload.old_record);
  }

  if (payload.table === "businesses" && payload.type === "INSERT") {
    return handleBusinessInsert(supabase, payload.record);
  }

  if (
    payload.table === "invoice_payments" &&
    (payload.type === "INSERT" || payload.type === "UPDATE")
  ) {
    return handleInvoicePayment(supabase, payload.record, payload.old_record);
  }

  if (payload.table === "quotations" && payload.type === "UPDATE") {
    return handleQuotationUpdate(supabase, payload.record, payload.old_record);
  }

  return { skipped: true, reason: "unsupported_webhook" };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  if (!verifyPushWebhookSecret(req)) {
    return Response.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  let body: DbWebhookPayload | CronPayload;
  try {
    body = (await req.json()) as DbWebhookPayload | CronPayload;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  try {
    if ("mode" in body && body.mode === "cron") {
      const supabase = createServiceSupabase();
      const result = await handleCronJob(supabase, body.job);
      return Response.json({ ok: true, ...result }, { status: 200, headers: corsHeaders });
    }

    const result = await handleDbWebhook(body as DbWebhookPayload);
    return Response.json({ ok: true, ...result }, { status: 200, headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-push-notification]", msg);
    return Response.json(
      { message: "Push delivery failed", error: msg },
      {
        status: 502,
        headers: corsHeaders,
      },
    );
  }
});
