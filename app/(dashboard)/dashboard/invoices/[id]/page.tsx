"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useInvoice,
  useDeleteInvoice,
  useSendInvoice,
  type InvoiceStatus,
} from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import { ShareInvoiceDialog } from "@/components/shared/share-invoice-dialog";
import { INVOICE_ELEMENT_ID } from "@/components/shared/invoice-export-buttons";
import { ArrowLeft, Pencil, Trash2, Share2 } from "lucide-react";
import dayjs from "dayjs";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  overdue: { label: "Overdue", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge
      variant={config.variant}
      className={
        status === "paid"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
          : status === "sent"
            ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            : status === "viewed"
              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
              : ""
      }
    >
      {config.label}
    </Badge>
  );
};

const InvoiceDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { invoice, loading, refetch } = useInvoice(id);
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  const isDraft = invoice.status === "draft";
  const draftHasRequiredDetails =
    !!invoice.client_id &&
    !!invoice.issue_date &&
    !!invoice.due_date &&
    !!invoice.currency &&
    (invoice.items?.length ?? 0) > 0 &&
    (invoice.items ?? []).every(
      (item) =>
        !!String(item.description).trim() &&
        Number(item.quantity) > 0 &&
        Number(item.unit_price) > 0,
    );
  const canShare = !isDraft || draftHasRequiredDetails;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${invoice.id}`;

  const handleDelete = () => {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.replace("/dashboard/invoices");
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{invoice.invoice_number}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              Created {dayjs(invoice.created_at).format("MMM D, YYYY")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => canShare && setShareDialogOpen(true)}
            disabled={!canShare}
            variant={!canShare ? "outline" : "default"}
            title={
              !canShare && isDraft
                ? "Complete client, dates, currency, and line items to share"
                : undefined
            }
          >
            <Share2 className="mr-1 size-4" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Invoice Preview — rendered with selected template */}
      <div id={INVOICE_ELEMENT_ID}>
        <InvoiceTemplate
          templateId={invoice.template_id ?? "classic"}
          invoiceNumber={invoice.invoice_number}
          status={invoice.status}
          issueDate={invoice.issue_date}
          dueDate={invoice.due_date}
          currency={invoice.currency}
          subtotal={Number(invoice.subtotal)}
          tax={Number(invoice.tax)}
          taxPercent={
            invoice.tax_percentage != null && Number(invoice.tax_percentage) > 0
              ? Number(invoice.tax_percentage)
              : Number(invoice.subtotal) > 0
                ? (Number(invoice.tax) / Number(invoice.subtotal)) * 100
                : null
          }
          total={Number(invoice.total)}
          notes={invoice.notes}
          accentColor={invoice.accent_color}
          footerNote={invoice.footer_note}
          isPaid={invoice.status === "paid"}
          business={invoice.business ?? null}
          client={invoice.client ?? null}
          items={(invoice.items ?? []).map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.total),
          }))}
        />
      </div>

      {/* Share Dialog */}
      <ShareInvoiceDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        invoiceNumber={invoice.invoice_number}
        clientName={invoice.client?.name ?? "Client"}
        total={Number(invoice.total).toLocaleString()}
        currency={invoice.currency}
        shareUrl={shareUrl}
        isDraft={isDraft}
        onShare={() => sendInvoice.mutate(invoice.id, { onSuccess: () => refetch() })}
        invoiceElementId={INVOICE_ELEMENT_ID}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{invoice.invoice_number}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteInvoice.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteInvoice.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetailPage;
