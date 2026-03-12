"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useInvoices,
  useDeleteInvoice,
  useSendInvoice,
  type Invoice,
  type InvoiceStatus,
} from "@/hooks/use-invoices";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Share2,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { ShareInvoiceDialog } from "@/components/shared/share-invoice-dialog";

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

const InvoicesContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusParam = searchParams.get("status") as InvoiceStatus | null;

  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(statusParam || "all");

  useEffect(() => {
    setStatusFilter(statusParam || "all");
  }, [statusParam]);

  const { invoices, loading, refetch } = useInvoices(
    currentBusinessId,
    statusFilter === "all" ? null : statusFilter,
  );
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const { format } = useFormatAmount();

  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.client?.name?.toLowerCase().includes(q) ||
        inv.notes?.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const openDelete = (inv: Invoice) => {
    setDeletingInvoice(inv);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingInvoice) return;
    deleteInvoice.mutate(deletingInvoice.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingInvoice(null);
        refetch();
      },
    });
  };

  const handleShare = (inv: Invoice) => {
    setSharingInvoice(inv);
    setShareDialogOpen(true);
  };

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Building2 className="text-muted-foreground size-12" />
          <div className="space-y-1 text-center">
            <p className="font-medium">No business yet</p>
            <p className="text-muted-foreground text-sm">
              Create a business first to start creating invoices.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/settings/businesses">Go to Businesses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Manage invoices for{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ?? "your business"}
            </span>
            .
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/invoices/create">
            <Plus className="mr-1 size-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by number, client..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                const next = v as InvoiceStatus | "all";
                setStatusFilter(next);
                const params = new URLSearchParams(searchParams.toString());
                if (next === "all") {
                  params.delete("status");
                } else {
                  params.set("status", next);
                }
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {invoices.length === 0
                  ? "No invoices yet. Create your first one."
                  : "No invoices match your search."}
              </p>
              {invoices.length === 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/invoices/create">
                    <Plus className="mr-1 size-4" />
                    Create Invoice
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-medium hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                      <div className="mt-1 sm:hidden">
                        <StatusBadge status={inv.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.client?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {dayjs(inv.issue_date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {dayjs(inv.due_date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {format(Number(inv.total))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${inv.id}`}>
                              <Eye className="mr-2 size-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {inv.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/invoices/${inv.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {inv.status !== "draft" && (
                            <DropdownMenuItem onClick={() => handleShare(inv)}>
                              <Share2 className="mr-2 size-4" />
                              Share
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDelete(inv)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {sharingInvoice && (
        <ShareInvoiceDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          invoiceNumber={sharingInvoice.invoice_number}
          clientName={sharingInvoice.client?.name ?? "Client"}
          total={Number(sharingInvoice.total).toLocaleString()}
          currency={sharingInvoice.currency}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${sharingInvoice.id}`}
          isDraft={sharingInvoice.status === "draft"}
          onShare={() => sendInvoice.mutate(sharingInvoice.id, { onSuccess: () => refetch() })}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deletingInvoice?.invoice_number}</span>? This cannot be
              undone.
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

const InvoicesPage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    }
  >
    <InvoicesContent />
  </Suspense>
);

export default InvoicesPage;
