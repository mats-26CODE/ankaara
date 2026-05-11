"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSales } from "@/hooks/use-sales";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Building2, ChevronLeft, ChevronRight, Eye, Plus, RotateCcw } from "lucide-react";

const PAGE_SIZE = 10;

const SalesPage = () => {
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
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
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId, fromDate, toDate]);

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
        <CardHeader className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_220px_1fr]">
          <DatePicker value={fromDate} onChange={setFromDate} placeholder="From date" />
          <DatePicker value={toDate} onChange={setToDate} placeholder="To date" />
          {(fromDate || toDate) && (
            <Button
              variant="outline"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="w-fit"
            >
              <RotateCcw className="mr-2 size-4" />
              Clear filters
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : sales.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No sales recorded yet.</p>
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
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
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
                    <TableCell>
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
