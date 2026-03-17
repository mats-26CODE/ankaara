"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useQuotations,
  useDeleteQuotation,
  useSendQuotation,
  type Quotation,
  type QuotationStatus,
} from "@/hooks/use-quotations";
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
} from "lucide-react";
import dayjs from "dayjs";
import { ShareQuotationDialog } from "@/components/shared/share-quotation-dialog";

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
            : status === "viewed"
              ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
              : ""
      }
    >
      {config.label}
    </Badge>
  );
};

const QuotationsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const statusParam = searchParams.get("status") as QuotationStatus | null;

  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">(statusParam || "all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setStatusFilter(statusParam || "all");
  }, [statusParam]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, statusFilter]);

  const { quotations, loading, refetch, totalCount } = useQuotations(
    currentBusinessId,
    statusFilter === "all" ? null : statusFilter,
    page,
    pageSize,
  );

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const deleteQuotation = useDeleteQuotation();
  const sendQuotation = useSendQuotation();
  const { format } = useFormatAmount();

  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingQuotation, setSharingQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const filtered = useMemo(() => {
    if (!search.trim()) return quotations;
    const q = search.toLowerCase();
    return quotations.filter(
      (quo) =>
        quo.quotation_number.toLowerCase().includes(q) ||
        quo.client?.name?.toLowerCase().includes(q) ||
        quo.notes?.toLowerCase().includes(q),
    );
  }, [quotations, search]);

  const openDelete = (quo: Quotation) => {
    setDeletingQuotation(quo);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingQuotation) return;
    deleteQuotation.mutate(deletingQuotation.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingQuotation(null);
        refetch();
      },
    });
  };

  const handleShare = (quo: Quotation) => {
    setSharingQuotation(quo);
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
              Create a business first to start creating quotations.
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
          <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground text-sm">
            Manage quotations for{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ?? "your business"}
            </span>
            .
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/quotations/create">
            <Plus className="mr-1 size-4" />
            New Quotation
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
                const next = v as QuotationStatus | "all";
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
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
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
                {quotations.length === 0
                  ? "No quotations yet. Create your first one."
                  : "No quotations match your search."}
              </p>
              {quotations.length === 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/quotations/create">
                    <Plus className="mr-1 size-4" />
                    Create Quotation
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                  <TableHead className="hidden md:table-cell">Valid Until</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((quo) => (
                  <TableRow key={quo.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/quotations/${quo.id}`}
                        className="font-medium hover:underline"
                      >
                        {quo.quotation_number}
                      </Link>
                      <div className="mt-1 sm:hidden">
                        <StatusBadge status={quo.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {quo.client?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <StatusBadge status={quo.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {dayjs(quo.issue_date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {quo.valid_until
                        ? dayjs(quo.valid_until).format("MMM D, YYYY")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {format(Number(quo.total))}
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
                            <Link href={`/dashboard/quotations/${quo.id}`}>
                              <Eye className="mr-2 size-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          {quo.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/quotations/${quo.id}/edit`}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {quo.status !== "draft" && (
                            <DropdownMenuItem onClick={() => handleShare(quo)}>
                              <Share2 className="mr-2 size-4" />
                              Share
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDelete(quo)}
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

          {!loading && total > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
              <p className="text-muted-foreground text-sm">
                Showing {from}–{to} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasNext}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {sharingQuotation && (
        <ShareQuotationDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          quotationNumber={sharingQuotation.quotation_number}
          clientName={sharingQuotation.client?.name ?? "Client"}
          total={Number(sharingQuotation.total).toLocaleString()}
          currency={sharingQuotation.currency}
          shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quotation/${sharingQuotation.id}`}
          isDraft={sharingQuotation.status === "draft"}
          onShare={() => sendQuotation.mutate(sharingQuotation.id, { onSuccess: () => refetch() })}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deletingQuotation?.quotation_number}</span>? This cannot
              be undone.
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

const QuotationsPage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    }
  >
    <QuotationsContent />
  </Suspense>
);

export default QuotationsPage;
