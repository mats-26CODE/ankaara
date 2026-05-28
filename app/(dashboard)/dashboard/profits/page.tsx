"use client";

import { useEffect, useState } from "react";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useProfitSummary } from "@/hooks/use-profits";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";
import { Wallet, TrendingUp, ReceiptText, Coins, Landmark, X } from "lucide-react";

const ProfitsPage = () => {
  const { businesses } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { format: formatAmount } = useFormatAmount();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { summary, loading } = useProfitSummary(
    currentBusinessId,
    fromDate || null,
    toDate || null,
  );

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profits</h1>
          <p className="text-muted-foreground text-sm">
            Analyze gross and net profits by selected timeline.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle>Profit Summary</CardTitle>
              {/* <p className="text-muted-foreground mt-1 text-sm">
                Timeline:{" "}
                {fromDate || toDate
                  ? `${fromDate ? new Date(fromDate).toLocaleDateString() : "Beginning"} to ${toDate ? new Date(toDate).toLocaleDateString() : "Today"}`
                  : "All time"}
              </p> */}
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
            <div className="flex justify-center py-10">
              <Spinner className="size-6" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Revenue</p>
                  <Wallet className="size-4 text-blue-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(summary.grossSales, { decimalDigits: 0 })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Total sales in selected timeline
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Sales Cost</p>
                  <ReceiptText className="size-4 text-violet-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(summary.cogs, { decimalDigits: 0 })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Cost of products/services sold</p>
              </div>
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Gross Profit</p>
                  <Coins className="size-4 text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(summary.grossProfit, { decimalDigits: 0 })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Revenue minus sales cost</p>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 text-red-600">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Expenses</p>
                  <Landmark className="size-4 text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(summary.expenses, { decimalDigits: 0 })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Operating costs recorded in expenses
                </p>
              </div>
              <div className="rounded-lg border bg-green-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Net Profit</p>
                  <TrendingUp className="size-4 text-green-600" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(summary.netProfit, { decimalDigits: 0 })}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">Gross profit after expenses</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitsPage;
