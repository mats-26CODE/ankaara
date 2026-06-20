"use client";

import { Suspense, useState, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import dayjs from "dayjs";
import { ShareInvoiceDialog } from "@/components/shared/share-invoice-dialog";
import { canConvertInvoiceToSale } from "@/lib/invoice-sale-conversion";
import { canShareInvoice } from "@/lib/invoices/can-share-invoice";
import { canDeleteInvoice } from "@/lib/invoices/can-delete-invoice";
import { useTranslation } from "@/hooks/use-translation";

const STATUS_VARIANT: Record<
  InvoiceStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  viewed: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
};

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const { t } = useTranslation();
  const variant = STATUS_VARIANT[status] ?? STATUS_VARIANT.draft;
  return (
    <Badge
      variant={variant}
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
      {t(`dashboard.status.${status}`)}
    </Badge>
  );
};

const InvoicesContent = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusParam = searchParams.get("status") as InvoiceStatus | null;

  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(statusParam || "all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setStatusFilter(statusParam || "all");
  }, [statusParam]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, statusFilter, debouncedSearch]);

  const { invoices, loading, refetch, totalCount } = useInvoices(
    currentBusinessId,
    statusFilter === "all" ? null : statusFilter,
    page,
    pageSize,
    debouncedSearch,
  );

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const { format } = useFormatAmount();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

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
            <p className="font-medium">{t("dashboard.common.noBusinessTitle")}</p>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.settings.businesses.create.description")}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/settings/businesses">{t("dashboard.common.goToBusinesses")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.nav.invoices")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.invoices.list.subtitlePrefix")}{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ??
                t("dashboard.common.yourBusiness")}
            </span>
            .
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/invoices/create">
            <Plus className="mr-1 size-4" />
            {t("dashboard.common.newInvoice")}
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
                placeholder={t("dashboard.invoices.list.searchPlaceholder")}
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
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder={t("dashboard.common.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.common.allStatuses")}</SelectItem>
                <SelectItem value="draft">{t("dashboard.status.draft")}</SelectItem>
                <SelectItem value="sent">{t("dashboard.status.sent")}</SelectItem>
                <SelectItem value="viewed">{t("dashboard.status.viewed")}</SelectItem>
                <SelectItem value="paid">{t("dashboard.status.paid")}</SelectItem>
                <SelectItem value="overdue">{t("dashboard.status.overdue")}</SelectItem>
                <SelectItem value="cancelled">{t("dashboard.status.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim()
                  ? t("dashboard.invoices.list.emptyNoMatch")
                  : t("dashboard.invoices.list.emptyNoData")}
              </p>
              {!debouncedSearch.trim() && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/invoices/create">
                    <Plus className="mr-1 size-4" />
                    {t("dashboard.common.createInvoice")}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.invoices.list.columnInvoice")}</TableHead>
                  <TableHead>{t("dashboard.common.client")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("dashboard.common.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.common.date")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("dashboard.invoices.list.columnDue")}</TableHead>
                  <TableHead className="text-right">{t("dashboard.common.amount")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">{inv.invoice_number}</span>
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
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
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
                              {t("dashboard.common.view")}
                            </Link>
                          </DropdownMenuItem>
                          {inv.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/invoices/${inv.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                {t("dashboard.common.edit")}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleShare(inv)}
                            disabled={!canShareInvoice(inv)}
                            title={
                              !canShareInvoice(inv) && inv.status === "draft"
                                ? t("dashboard.invoices.share.incompleteDraft")
                                : undefined
                            }
                          >
                            <Share2 className="mr-2 size-4" />
                            {t("dashboard.common.share")}
                          </DropdownMenuItem>
                          {canConvertInvoiceToSale(inv.status, !!inv.linked_sale_id) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/invoices/${inv.id}?convert=1`}>
                                <ShoppingCart className="mr-2 size-4" />
                                {t("dashboard.common.convertToSale")}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDelete(inv)}
                            disabled={!canDeleteInvoice(inv.status)}
                            className="text-destructive focus:text-destructive"
                            title={
                              !canDeleteInvoice(inv.status)
                                ? t("dashboard.invoices.list.paidDeleteBlocked")
                                : undefined
                            }
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t("dashboard.common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && total > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
              <p className="text-muted-foreground text-sm">
                {t("dashboard.common.showingRange", { from, to, total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                >
                  <ChevronLeft className="size-4" />
                  {t("dashboard.common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasNext}
                >
                  {t("dashboard.common.next")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {sharingInvoice && (
        <ShareInvoiceDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          invoiceNumber={sharingInvoice.invoice_number}
          clientName={sharingInvoice.client?.name ?? t("dashboard.invoices.share.clientFallback")}
          total={Number(sharingInvoice.total).toLocaleString()}
          currency={sharingInvoice.currency}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/invoice/${sharingInvoice.id}`}
          isDraft={sharingInvoice.status === "draft"}
          onSendIfDraft={async () => {
            if (sharingInvoice.status !== "draft") return;
            await sendInvoice.mutateAsync(sharingInvoice.id);
            await refetch();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.invoices.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.invoices.delete.description", {
                number: deletingInvoice?.invoice_number ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteInvoice.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteInvoice.isPending}
            >
              {t("dashboard.common.delete")}
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
