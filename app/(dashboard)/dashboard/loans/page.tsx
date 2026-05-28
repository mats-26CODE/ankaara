"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useLoans } from "@/hooks/use-loans";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  HandCoins,
  Plus,
  Search,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

const LoansPage = () => {
  const router = useRouter();
  const { format: formatAmount } = useFormatAmount();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { loans, loading, totalCount } = useLoans(
    currentBusinessId,
    page,
    PAGE_SIZE,
    fromDate || null,
    toDate || null,
    debouncedSearch,
  );

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId],
  );

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, fromDate, toDate, debouncedSearch]);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  if (businessesLoading) {
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
              Create a business first to record loans.
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
          <h1 className="text-2xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground text-sm">
            Client loans and repayments for{" "}
            <span className="font-medium">{activeBusiness?.name ?? "your business"}</span>.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/loans/create">
            <Plus className="mr-1 size-4" />
            New Loan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name or loan number..."
                className="pl-9"
              />
            </div>
            <div className="flex w-full items-center gap-3 lg:w-auto">
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder="From date"
                className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                disableFuture
              />
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder="To date"
                className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                disableFuture
              />
              {(fromDate || toDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="shrink-0"
                >
                  <X className="size-4 text-red-400" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : loans.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <HandCoins className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim() || fromDate || toDate
                  ? "No loans match your search or filters."
                  : "No loans recorded yet. Record your first loan."}
              </p>
              {!debouncedSearch.trim() && !fromDate && !toDate && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/loans/create">
                    <Plus className="mr-1 size-4" />
                    New Loan
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                  >
                    <TableCell className="font-medium">{loan.loan_number}</TableCell>
                    <TableCell>{dayjs(loan.loan_date).format("MMM D, YYYY")}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {loan.client?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "paid" ? "default" : "secondary"}>
                        {loan.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(Number(loan.total), { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(Number(loan.outstanding_balance), { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/loans/${loan.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {from}-{to} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || loading}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansPage;
