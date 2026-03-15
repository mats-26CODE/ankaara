import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants/values";
import { Button } from "@/components/ui/button";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import {
  InvoiceExportButtons,
  INVOICE_ELEMENT_ID,
} from "@/components/shared/invoice-export-buttons";
import Logo from "@/components/shared/logo";
import { CheckCircle2, Clock, CreditCard } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number, client:clients(name)")
    .eq("id", id)
    .single();

  if (!data) return { title: "Invoice Not Found" };

  const clientName = (data.client as { name: string } | null)?.name ?? "Client";
  const title = `${data.invoice_number} — ${clientName} | ${APP_NAME}`;

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const baseUrl = host ? `${protocol}://${host}` : "";

  return {
    title,
    openGraph: {
      title,
      images: baseUrl ? [`${baseUrl}/invoice/${id}/opengraph-image`] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: baseUrl ? [`${baseUrl}/invoice/${id}/opengraph-image`] : undefined,
    },
  };
};

const InvoiceContent = async ({ id }: { id: string }) => {
  await connection();
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "*, client:clients(id, name, email, phone, address), business:businesses!invoices_business_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)",
    )
    .eq("id", id)
    .single();

  if (error || !invoice || invoice.status === "draft") {
    notFound();
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("id", { ascending: true });

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const ua = headersList.get("user-agent") || null;

  await supabase.from("invoice_views").insert({
    invoice_id: id,
    ip_address: ip,
    user_agent: ua,
  });

  if (invoice.status === "sent") {
    await supabase.from("invoices").update({ status: "viewed" }).eq("id", id).eq("status", "sent");
  }

  const client = invoice.client as {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  const business = invoice.business as {
    name: string;
    address: string | null;
    logo_url: string | null;
    logo_text: string | null;
    tax_number: string | null;
    brand_color: string | null;
    currency: string;
  } | null;

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";
  const total = Number(invoice.total);

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" />
        </div>
        {/* Status banner */}
        {isPaid && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
            <span className="font-medium">This invoice has been paid</span>
          </div>
        )}
        {isOverdue && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <Clock className="size-5" />
            <span className="font-medium">This invoice is overdue</span>
          </div>
        )}

        <div id={INVOICE_ELEMENT_ID} className="rounded-xl bg-white">
          <InvoiceTemplate
            templateId={invoice.template_id ?? "classic"}
            invoiceNumber={invoice.invoice_number}
            status={invoice.status}
            issueDate={invoice.issue_date}
            dueDate={invoice.due_date}
            currency={invoice.currency}
            subtotal={Number(invoice.subtotal)}
            totalDiscount={
              (items ?? []).reduce((s, i) => s + Number(i.discount ?? 0), 0) || undefined
            }
            tax={Number(invoice.tax)}
            taxPercent={
              invoice.tax_percentage != null && Number(invoice.tax_percentage) > 0
                ? Number(invoice.tax_percentage)
                : Number(invoice.subtotal) > 0
                  ? (Number(invoice.tax) / Number(invoice.subtotal)) * 100
                  : null
            }
            total={total}
            notes={invoice.notes}
            accentColor={invoice.accent_color}
            footerNote={invoice.footer_note}
            isPaid={isPaid}
            business={business}
            client={client}
            items={(items ?? []).map((item) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              discount: Number(item.discount ?? 0) > 0 ? Number(item.discount) : undefined,
              total: Number(item.total),
            }))}
          />
        </div>

        <div className="mt-6 flex items-center justify-center">
          <InvoiceExportButtons invoiceNumber={invoice.invoice_number} />
        </div>

        {/* Pay section */}
        {!isPaid && (
          <div className="bg-background mt-6 space-y-3 rounded-lg border p-6 text-center">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Amount Due</p>
              <p className="text-3xl font-bold tracking-tight">
                {invoice.currency} {total.toLocaleString()}
              </p>
            </div>
            <Button size="lg" disabled className="min-w-[220px]">
              <CreditCard className="mr-2 size-4" />
              Pay Now — Coming Soon
            </Button>
            <p className="text-muted-foreground text-xs">
              Online payments will be available soon via Snipe Payment Gateway.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PublicInvoicePage = async ({ params }: Props) => {
  const { id } = await params;
  return <InvoiceContent id={id} />;
};

export default PublicInvoicePage;
