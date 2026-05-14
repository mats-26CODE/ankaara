"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { deferNavigation } from "@/lib/navigation/defer-navigation";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSales, type Sale } from "@/hooks/use-sales";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

const PAGE_SIZE = 10;

const saleMatchesItemSearch = (sale: Sale, q: string) =>
  (sale.items ?? []).some((item) => {
    const label = (item.product?.name?.trim() || item.description?.trim() || "Item").toLowerCase();
    const desc = item.description?.toLowerCase() ?? "";
    const prod = item.product?.name?.toLowerCase() ?? "";
    return label.includes(q) || desc.includes(q) || prod.includes(q);
  });

const SalesPage = () => {
  const router = useRouter();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { sales, loading, totalCount } = useSales(
    currentBusinessId,
    page,
    PAGE_SIZE,
    fromDate || null,
    toDate || null,
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
  }, [currentBusinessId, fromDate, toDate]);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const filtered = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter(
      (sale) =>
        sale.sale_number.toLowerCase().includes(q) ||
        sale.client?.name?.toLowerCase().includes(q) ||
        sale.invoice?.invoice_number?.toLowerCase().includes(q) ||
        sale.source.toLowerCase().includes(q) ||
        saleMatchesItemSearch(sale, q),
    );
  }, [sales, search]);

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
              Create a business first to record sales.
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
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground text-sm">
            Product, service, and paid-invoice sales for{" "}
            <span className="font-medium">{activeBusiness?.name ?? "your business"}</span>.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/sales/create">
            <Plus className="mr-1 size-4" />
            Record Sale
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
                placeholder="Search by  product, sale number, client, invoice..."
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingCart className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {sales.length === 0
                  ? "No sales recorded yet. Record your first sale."
                  : "No sales match your search or filters."}
              </p>
              {sales.length === 0 && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/sales/create">
                    <Plus className="mr-1 size-4" />
                    Record Sale
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden md:table-cell">Profit</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      deferNavigation(() => router.push(`/dashboard/sales/${sale.id}`))
                    }
                  >
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{dayjs(sale.sale_date).format("MMM D, YYYY")}</TableCell>
                    <TableCell>
                      <Badge variant={sale.source === "invoice" ? "secondary" : "default"}>
                        {sale.source === "invoice" ? "Invoice" : "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {sale.client?.name ?? "Walk-in"}
                    </TableCell>
                    <TableCell>{Number(sale.total).toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {Number(sale.profit).toLocaleString()}
                    </TableCell>
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/sales/${sale.id}`}>
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

export default SalesPage;
