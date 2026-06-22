"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Package,
  Search,
  ShoppingBag,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { useEffectiveSubscription } from "@/hooks/use-effective-subscription";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { useProductSalesReport } from "@/hooks/use-product-sales-report";
import { getPlanTier } from "@/hooks/use-subscription-plans";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProductSalesSummaryStats } from "@/components/reports/product-sales-summary-stats";
import { ReportsIcon } from "@/components/icons/reports-icon";
import { REPORTS_EMPTY_NO_BUSINESS } from "@/constants/reports";
import { resolveReportPeriodRange, type ReportPeriodPreset } from "@/lib/dates/report-period";
import {
  filterProductSalesRows,
  getRevenueSharePercent,
  sortProductSalesRows,
  type ProductSalesSortKey,
} from "@/lib/reports/product-sales-report";
import { getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";

const SORT_OPTIONS: ProductSalesSortKey[] = ["units", "revenue", "profit"];

const ProductSalesReportPage = () => {
  const { t } = useTranslation();
  const { format: formatAmount } = useFormatAmount();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    planInheritedFromBusiness,
    activeBusiness,
  } = useEffectiveSubscription();

  const [periodPreset, setPeriodPreset] = useState<ReportPeriodPreset>("weekly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<ProductSalesSortKey>("revenue");
  const debouncedSearch = useDebouncedValue(search);

  const planTier = getPlanTier(subscription?.planSlug);
  const hasReportAccess = planTier !== "free";

  const periodOptions = useMemo(
    () =>
      [
        { id: "weekly" as const, label: t("dashboard.reports.productSales.period.last7Days") },
        { id: "monthly" as const, label: t("dashboard.reports.productSales.period.thisMonth") },
        { id: "all_time" as const, label: t("dashboard.reports.productSales.period.allTime") },
      ] satisfies { id: ReportPeriodPreset; label: string }[],
    [t],
  );

  const resolvedRange = useMemo(() => {
    if (periodPreset === "custom") {
      return resolveReportPeriodRange("custom", fromDate, toDate);
    }
    return resolveReportPeriodRange(periodPreset);
  }, [fromDate, periodPreset, toDate]);

  const { rows, summary, isLoading, isRefetching } = useProductSalesReport(
    currentBusinessId,
    resolvedRange.fromDate,
    resolvedRange.toDate,
    hasReportAccess,
  );

  const displayRows = useMemo(() => {
    const filtered = filterProductSalesRows(rows, debouncedSearch);
    return sortProductSalesRows(filtered, sortBy);
  }, [debouncedSearch, rows, sortBy]);

  const summaryLoading = isLoading || isRefetching;

  const summaryMetrics = useMemo(
    () => [
      {
        key: "revenue",
        label: t("dashboard.reports.productSales.summary.totalRevenue"),
        value: formatAmount(summary.totalRevenue, { decimalDigits: 0 }),
        icon: Wallet,
        iconClassName: "text-blue-600",
      },
      {
        key: "units",
        label: t("dashboard.reports.productSales.summary.totalUnits"),
        value: summary.totalUnits.toLocaleString(),
        icon: ShoppingBag,
        iconClassName: "text-violet-600",
      },
      {
        key: "products",
        label: t("dashboard.reports.productSales.summary.productsSold"),
        value: summary.productCount.toLocaleString(),
        icon: Package,
        iconClassName: "text-amber-600",
      },
      {
        key: "top",
        label: t("dashboard.reports.productSales.summary.topProduct"),
        value: summary.topProductName ?? "—",
        icon: Trophy,
        iconClassName: "text-green-600",
        valueClassName: "truncate text-xl font-bold lg:text-2xl",
      },
    ],
    [formatAmount, summary, t],
  );

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const handlePresetChange = (preset: ReportPeriodPreset) => {
    setPeriodPreset(preset);
    if (preset !== "custom") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setPeriodPreset("custom");
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setPeriodPreset("custom");
  };

  const handleClearDates = () => {
    setFromDate("");
    setToDate("");
    setPeriodPreset("weekly");
  };

  if (businessesLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.reports.productSales.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.reports.productSales.description")}
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
            <Building2 className="text-muted-foreground size-12" />
            <div className="space-y-1">
              <p className="font-medium">{t("dashboard.common.noBusinessTitle")}</p>
              <p className="text-muted-foreground text-sm">
                {t("dashboard.empty.noBusiness.reports")}
              </p>
            </div>
            <Button asChild>
              <Link href={REPORTS_EMPTY_NO_BUSINESS.actionHref}>
                {t("dashboard.common.goToBusinesses")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasReportAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.reports.productSales.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.reports.productSales.description")}
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
            <ReportsIcon className="text-muted-foreground size-12" />
            <div className="max-w-md space-y-1">
              <p className="font-medium">{t("dashboard.reports.upgrade.title")}</p>
              <p className="text-muted-foreground text-sm">
                {t("dashboard.reports.upgrade.description")}
              </p>
            </div>
            {planInheritedFromBusiness ? (
              <p className="text-muted-foreground max-w-md text-sm">
                {t("dashboard.common.staffPlanUpgradeHint")}
              </p>
            ) : (
              <Button asChild>
                <Link href={getSubscribeUrlForPlanLimit("PLAN_LIMIT:product_sales_reports")}>
                  {t("dashboard.common.viewPlans")}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/reports" aria-label={t("dashboard.reports.productSales.backAriaLabel")}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("dashboard.reports.productSales.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeBusiness
                ? t("dashboard.reports.productSales.businessSubtitle", { name: activeBusiness.name })
                : t("dashboard.reports.productSales.description")}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col justify-between gap-3">
            <div>
              <CardTitle>{t("dashboard.reports.productSales.summaryTitle")}</CardTitle>
              <CardDescription>{t("dashboard.reports.productSales.summaryDescription")}</CardDescription>
            </div>
            <div className="flex w-full flex-col flex-wrap gap-3 lg:w-auto lg:flex-row lg:items-center">
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    className="h-9"
                    variant={periodPreset === option.id ? "default" : "outline"}
                    onClick={() => handlePresetChange(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="flex w-full items-center gap-3 lg:w-auto">
                <DatePicker
                  value={fromDate}
                  onChange={handleFromDateChange}
                  placeholder={t("dashboard.common.fromDate")}
                  className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                  disableFuture
                />
                <DatePicker
                  value={toDate}
                  onChange={handleToDateChange}
                  placeholder={t("dashboard.common.toDate")}
                  className="min-w-0 flex-1 lg:w-fit lg:flex-none"
                  disableFuture
                />
                {(fromDate || toDate || periodPreset === "custom") && (
                  <Button variant="outline" onClick={handleClearDates} className="shrink-0">
                    <X className="size-4 text-red-400" />
                    {t("dashboard.common.clear")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProductSalesSummaryStats loading={summaryLoading} metrics={summaryMetrics} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>{t("dashboard.reports.productSales.rankingsTitle")}</CardTitle>
            <CardDescription>{t("dashboard.reports.productSales.rankingsDescription")}</CardDescription>
          </div>
          <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("dashboard.reports.productSales.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground hidden text-sm font-medium md:block">
                {t("dashboard.reports.productSales.sortByLabel")}
              </p>
              {SORT_OPTIONS.map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={sortBy === key ? "default" : "outline"}
                  onClick={() => setSortBy(key)}
                >
                  {t(`dashboard.reports.productSales.sort.${key}`)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : displayRows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ReportsIcon className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">
                {debouncedSearch.trim()
                  ? t("dashboard.reports.productSales.noMatch")
                  : t("dashboard.reports.productSales.emptyDescription")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    {t("dashboard.reports.productSales.columns.rank")}
                  </TableHead>
                  <TableHead className="min-w-[120px]">{t("dashboard.common.product")}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    {t("dashboard.reports.productSales.columns.units")}
                  </TableHead>
                  <TableHead className="text-right">{t("dashboard.common.revenue")}</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    {t("dashboard.common.profit")}
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    {t("dashboard.reports.productSales.columns.share")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row, index) => (
                  <TableRow key={`${row.product_id ?? "orphan"}-${row.product_name}-${index}`}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="max-w-[180px] whitespace-normal sm:max-w-none">
                      <div className="font-medium">{row.product_name}</div>
                      {row.sku ? (
                        <div className="text-muted-foreground text-xs">{row.sku}</div>
                      ) : null}
                      {row.is_orphan_line ? (
                        <div className="text-muted-foreground text-xs">
                          {t("dashboard.reports.productSales.deletedProductHint")}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {row.units_sold.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.revenue, { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {formatAmount(row.profit, { decimalDigits: 0 })}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {getRevenueSharePercent(row.revenue, summary.totalRevenue).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSalesReportPage;
