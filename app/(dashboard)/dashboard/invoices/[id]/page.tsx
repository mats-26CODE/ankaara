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
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToastAlert } from "@/config/toast";
import {
  ArrowLeft,
  Pencil,
  Send,
  Trash2,
  ExternalLink,
  Copy,
} from "lucide-react";
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
  const { format } = useFormatAmount();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${invoice.id}`;

  const handleSend = () => {
    sendInvoice.mutate(invoice.id, { onSuccess: () => refetch() });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    ToastAlert.success("Link copied to clipboard");
  };

  const handleDelete = () => {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.replace("/dashboard/invoices");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {invoice.invoice_number}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created {dayjs(invoice.created_at).format("MMM D, YYYY")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                  <Pencil className="size-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sendInvoice.isPending}
              >
                {sendInvoice.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <>
                    <Send className="size-4 mr-1" />
                    Mark as Sent
                  </>
                )}
              </Button>
            </>
          )}
          {!isDraft && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="size-4 mr-1" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4 mr-1" />
                  Open Public Page
                </a>
              </Button>
            </>
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

      {/* Invoice Preview Card */}
      <Card>
        <CardHeader className="pb-0">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bill To
              </p>
              <p className="mt-1 font-semibold">{invoice.client?.name}</p>
              {invoice.client?.email && (
                <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
              )}
              {invoice.client?.phone && (
                <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>
              )}
              {invoice.client?.address && (
                <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
              )}
            </div>
            <div className="sm:text-right space-y-1">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Issue Date
                </p>
                <p className="text-sm">{dayjs(invoice.issue_date).format("MMM D, YYYY")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </p>
                <p className="text-sm">{dayjs(invoice.due_date).format("MMM D, YYYY")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Currency
                </p>
                <p className="text-sm">{invoice.currency}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Items table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{Number(item.quantity)}</TableCell>
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

          <Separator className="my-4" />

          {/* Totals */}
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
            <Separator className="my-1 w-60" />
            <div className="flex w-60 justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{format(Number(invoice.total))}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Notes
              </p>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{invoice.invoice_number}</span>? This
              cannot be undone.
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
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending ? <Spinner className="size-4" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetailPage;
