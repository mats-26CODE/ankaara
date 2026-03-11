import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants/values";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

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
      "*, client:clients(id, name, email, phone, address), business:businesses!invoices_organization_id_fkey(id, name, address, logo_url, tax_number, currency)"
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
    tax_number: string | null;
    currency: string;
  } | null;

  const isPaid = invoice.status === "paid";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Invoice Card */}
        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b bg-muted/30 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                {business?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="h-10 w-auto mb-2"
                  />
                ) : (
                  <p className="text-xl font-bold">{business?.name}</p>
                )}
                {business?.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {business.address}
                  </p>
                )}
                {business?.tax_number && (
                  <p className="text-xs text-muted-foreground">
                    TIN: {business.tax_number}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold">{invoice.invoice_number}</p>
                <div className="mt-1">
                  {isPaid ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Paid
                    </Badge>
                  ) : invoice.status === "overdue" ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge variant="outline">
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="px-6 py-6 sm:px-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bill To
                </p>
                <p className="mt-1 font-semibold">{client?.name}</p>
                {client?.email && (
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                )}
                {client?.phone && (
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                )}
                {client?.address && (
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                )}
              </div>
              <div className="sm:text-right space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Issue Date
                  </p>
                  <p className="text-sm">
                    {dayjs(invoice.issue_date).format("MMMM D, YYYY")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Due Date
                  </p>
                  <p className="text-sm">
                    {dayjs(invoice.due_date).format("MMMM D, YYYY")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="px-6 py-6 sm:px-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.unit_price).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(item.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Totals */}
          <div className="px-6 py-6 sm:px-8">
            <div className="flex flex-col items-end gap-1">
              <div className="flex w-60 justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{Number(invoice.subtotal).toLocaleString()}</span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex w-60 justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{Number(invoice.tax).toLocaleString()}</span>
                </div>
              )}
              <Separator className="my-2 w-60" />
              <div className="flex w-60 justify-between font-bold text-xl">
                <span>Total</span>
                <span>
                  {invoice.currency} {Number(invoice.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div className="px-6 py-6 sm:px-8">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Pay Button */}
          {!isPaid && (
            <>
              <Separator />
              <div className="px-6 py-6 sm:px-8 flex justify-center">
                <Button size="lg" disabled className="min-w-[200px]">
                  Pay Now — Coming Soon
                </Button>
              </div>
            </>
          )}
        </div>

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
