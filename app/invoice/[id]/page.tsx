import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants/values";
import { Button } from "@/components/ui/button";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";

export const dynamic = "force-dynamic";

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
  return {
    title: `${data.invoice_number} — ${clientName} | ${APP_NAME}`,
  };
};

const PublicInvoicePage = async ({ params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "*, client:clients(id, name, email, phone, address), business:businesses!invoices_organization_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)"
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
    await supabase
      .from("invoices")
      .update({ status: "viewed" })
      .eq("id", id)
      .eq("status", "sent");
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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <InvoiceTemplate
          templateId={invoice.template_id ?? "classic"}
          invoiceNumber={invoice.invoice_number}
          status={invoice.status}
          issueDate={invoice.issue_date}
          dueDate={invoice.due_date}
          currency={invoice.currency}
          subtotal={Number(invoice.subtotal)}
          tax={Number(invoice.tax)}
          total={Number(invoice.total)}
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
            total: Number(item.total),
          }))}
        />

        {/* Pay Button */}
        {!isPaid && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" disabled className="min-w-[200px]">
              Pay Now — Coming Soon
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <span className="font-brand">{APP_NAME}</span>
        </p>
      </div>
    </div>
  );
};

export default PublicInvoicePage;
