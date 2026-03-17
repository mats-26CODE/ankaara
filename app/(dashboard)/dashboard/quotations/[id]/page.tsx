"use client";

import { use } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useQuotation,
  useDeleteQuotation,
  useSendQuotation,
  useCancelQuotation,
  type QuotationStatus,
} from "@/hooks/use-quotations";
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
import { QuotationTemplate } from "@/lib/quotation-templates/registry";
import { ShareQuotationDialog } from "@/components/shared/share-quotation-dialog";
import { QUOTATION_ELEMENT_ID } from "@/components/shared/quotation-export-buttons";
import { QuotationExportButtons } from "@/components/shared/quotation-export-buttons";
import { ArrowLeft, Pencil, Trash2, Share2, FileText, XCircle } from "lucide-react";
import dayjs from "dayjs";

const STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

const StatusBadge = ({ status }: { status: QuotationStatus }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge
      variant={config.variant}
      className={
        status === "accepted"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"
          : status === "sent"
            ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            : ""
      }
    >
      {config.label}
    </Badge>
  );
};

const QuotationDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { quotation, loading, refetch } = useQuotation(id);
  const deleteQuotation = useDeleteQuotation();
  const sendQuotation = useSendQuotation();
  const cancelQuotation = useCancelQuotation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Quotation not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/quotations">Back to Quotations</Link>
        </Button>
      </div>
    );
  }

  const isDraft = quotation.status === "draft";
  const draftHasRequiredDetails =
    !!quotation.client_id &&
    !!quotation.issue_date &&
    !!quotation.currency &&
    (quotation.items?.length ?? 0) > 0 &&
    (quotation.items ?? []).every(
      (item) =>
        !!String(item.description).trim() &&
        Number(item.quantity) > 0 &&
        Number(item.unit_price) > 0,
    );
  const canShare = !isDraft || draftHasRequiredDetails;
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/quotation/${quotation.id}`;

  const handleDelete = () => {
    deleteQuotation.mutate(quotation.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.replace("/dashboard/quotations");
      },
    });
  };

  const handleCancel = () => {
    cancelQuotation.mutate(quotation.id, {
      onSuccess: () => {
        setCancelDialogOpen(false);
        refetch();
      },
    });
  };

  const canCancel =
    quotation.status === "draft" ||
    quotation.status === "sent" ||
    quotation.status === "viewed";

  const totalDiscount = (quotation.items ?? []).reduce((s, i) => s + Number(i.discount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{quotation.quotation_number}</h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-muted-foreground text-sm">
              Created {dayjs(quotation.created_at).format("MMM D, YYYY")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/quotations/${quotation.id}/edit`}>
                <Pencil className="mr-1 size-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/invoices/create?quotation=${quotation.id}`}>
              <FileText className="mr-1 size-4" />
              Create Invoice
            </Link>
          </Button>
          <QuotationExportButtons quotationNumber={quotation.quotation_number} />
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
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            >
              <XCircle className="mr-1 size-4" />
              Cancel
            </Button>
          )}
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

      <div id={QUOTATION_ELEMENT_ID}>
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
          total={Number(quotation.total)}
          notes={quotation.notes}
          scopeOfWork={quotation.scope_of_work ?? null}
          accentColor={quotation.accent_color}
          footerNote={quotation.footer_note}
          business={quotation.business ?? null}
          client={quotation.client ?? null}
          items={(quotation.items ?? []).map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount: Number(item.discount ?? 0) > 0 ? Number(item.discount) : undefined,
            total: Number(item.total),
          }))}
        />
      </div>

      <ShareQuotationDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        quotationNumber={quotation.quotation_number}
        clientName={quotation.client?.name ?? "Client"}
        total={Number(quotation.total).toLocaleString()}
        currency={quotation.currency}
        shareUrl={shareUrl}
        isDraft={isDraft}
        onShare={() => sendQuotation.mutate(quotation.id, { onSuccess: () => refetch() })}
        quotationElementId={QUOTATION_ELEMENT_ID}
      />

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Quotation</DialogTitle>
            <DialogDescription>
              Cancel this quotation? It will no longer be valid. The client will not be able to
              accept it. You can still view and export it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelQuotation.isPending}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              isLoading={cancelQuotation.isPending}
            >
              Cancel Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{quotation.quotation_number}</span>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteQuotation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteQuotation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationDetailPage;
