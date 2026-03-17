import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants/values";
import { QuotationTemplate } from "@/lib/quotation-templates/registry";
import { QuotationExportButtons } from "@/components/shared/quotation-export-buttons";
import { AcceptQuotationButton } from "@/components/shared/accept-quotation-button";
import Logo from "@/components/shared/logo";
import { CheckCircle2 } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("quotations")
    .select("quotation_number, client:clients(name)")
    .eq("id", id)
    .single();

  if (!data) return { title: "Quotation Not Found" };

  const clientName = (data.client as { name: string } | null)?.name ?? "Client";
  const title = `${data.quotation_number} — ${clientName} | ${APP_NAME}`;

  return { title };
};

const QuotationContent = async ({ id }: { id: string }) => {
  await connection();
  const supabase = createAnonClient();

  const { data: quotation, error } = await supabase
    .from("quotations")
    .select(
      "*, client:clients(id, name, email, phone, address), business:businesses!quotations_business_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)",
    )
    .eq("id", id)
    .single();

  if (error || !quotation || quotation.status === "draft") {
    notFound();
  }

  const { data: items } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("id", { ascending: true });

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const ua = headersList.get("user-agent") || null;

  await supabase.from("quotation_views").insert({
    quotation_id: id,
    ip_address: ip,
    user_agent: ua,
  });

  if (quotation.status === "sent") {
    await supabase
      .from("quotations")
      .update({ status: "viewed" })
      .eq("id", id)
      .eq("status", "sent");
  }

  const client = quotation.client as {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  const business = quotation.business as {
    name: string;
    address: string | null;
    logo_url: string | null;
    logo_text: string | null;
    tax_number: string | null;
    brand_color: string | null;
    currency: string;
  } | null;

  const isAccepted = quotation.status === "accepted";
  const total = Number(quotation.total);
  const totalDiscount = (items ?? []).reduce((s, i) => s + Number(i.discount ?? 0), 0);

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" />
        </div>
        {isAccepted && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
            <span className="font-medium">This quotation has been accepted</span>
          </div>
        )}

        {quotation.status === "cancelled" && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
            <span className="font-medium">This quotation has been cancelled</span>
          </div>
        )}

        {quotation.status === "expired" && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <span className="font-medium">This quotation has expired</span>
          </div>
        )}

        {!isAccepted && quotation.status !== "cancelled" && quotation.status !== "expired" && (
          <div className="mb-6 flex justify-center">
            <AcceptQuotationButton quotationId={id} validUntil={quotation.valid_until} />
          </div>
        )}

        <div id="quotation-to-export" className="rounded-xl bg-white">
          <QuotationTemplate
            templateId={quotation.template_id ?? "classic"}
            quotationNumber={quotation.quotation_number}
            status={quotation.status}
            issueDate={quotation.issue_date}
            validUntil={quotation.valid_until}
            currency={quotation.currency}
            subtotal={Number(quotation.subtotal)}
            totalDiscount={totalDiscount > 0 ? totalDiscount : undefined}
            tax={Number(quotation.tax)}
            taxPercent={
              quotation.tax_percentage != null && Number(quotation.tax_percentage) > 0
                ? Number(quotation.tax_percentage)
                : Number(quotation.subtotal) > 0
                  ? (Number(quotation.tax) / Number(quotation.subtotal)) * 100
                  : null
            }
            total={total}
            notes={quotation.notes}
            scopeOfWork={quotation.scope_of_work ?? null}
            accentColor={quotation.accent_color}
            footerNote={quotation.footer_note}
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
          <QuotationExportButtons quotationNumber={quotation.quotation_number} />
        </div>
      </div>
    </div>
  );
};

const PublicQuotationPage = async ({ params }: Props) => {
  const { id } = await params;
  return <QuotationContent id={id} />;
};

export default PublicQuotationPage;
