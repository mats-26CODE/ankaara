"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionPlanBadge } from "@/components/shared/subscription-plan-badge";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/hooks/use-translation";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { getGreetingKey } from "@/lib/i18n/greeting";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useEffectiveSubscription } from "@/hooks/use-effective-subscription";
import { useSubscriptionPlans, type SubscriptionPlanSlug } from "@/hooks/use-subscription-plans";
import { useIsStaffUser, useStaffPermissions } from "@/hooks/use-staff-permissions";
import {
  UserRound,
  ChevronRight,
  FileText,
  Quote,
  Users,
  Plus,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Building2,
  Check,
  ChevronDown,
  Zap,
  ShoppingCart,
  TrendingUp,
  Package,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardStatSkeleton = ({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "lg" | "count";
}) => (
  <Skeleton
    className={cn(
      "bg-muted",
      size === "lg" && "h-7 w-14 rounded-sm",
      size === "count" && "h-5 w-10 rounded-sm",
      size === "default" && "h-5 w-24 rounded-sm",
      className,
    )}
  />
);

/**
 * Check whether the profile has the essential fields filled in.
 * "Skip for now" sets onboarding_completed but leaves fields empty — we
 * treat the profile as incomplete when key data is missing.
 * Phone is optional so it's excluded from the essential check.
 */
const checkProfileCompleteness = (profile: ReturnType<typeof useProfile>["profile"]) => {
  if (!profile) return { complete: false, missing: [] as string[] };

  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push("name");

  return { complete: missing.length === 0, missing };
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { format: formatAmount } = useFormatAmount();
  const permissions = useStaffPermissions();
  const isStaff = useIsStaffUser();
  const showDashboard = permissions.can("dashboard", "view");
  const showProfits = permissions.can("profits", "view");
  const showInvoices = permissions.can("invoices", "view");
  const {
    invoiceStats,
    salesStats,
    inventoryStats,
    clientCount,
    productCount,
    quotationCount,
    loading: statsLoading,
  } = useDashboardStats(user?.id, currentBusinessId, { enabled: showDashboard });
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    planInheritedFromBusiness,
  } = useEffectiveSubscription();
  const { data: plans } = useSubscriptionPlans();
  const currentPlanSlug = (subscription?.planSlug ?? "free") as SubscriptionPlanSlug;
  const currentPlan = plans?.find((p) => p.slug === currentPlanSlug);
  const isFreePlan = currentPlanSlug === "free";
  const upgradeHref = "/subscribe?plan=pro-monthly";
  const changePlanHref = "/subscribe";

  const activeBusiness =
    businesses.find((b) => b.id === currentBusinessId) ?? businesses[0] ?? null;

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const { complete: isProfileComplete, missing } = checkProfileCompleteness(profile);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted h-10 w-64 animate-pulse rounded" />
        <div className="bg-muted h-40 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted h-28 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6 md:mt-0">
      {/* ────── Welcome Header ────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            {t(getGreetingKey())}
            {profile?.full_name?.trim() ? ` ${profile.full_name.trim().split(/\s+/)[0]}` : ""}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.home.greetingSubtitle")}</p>
          {activeBusiness && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-muted-foreground text-sm">{t("dashboard.common.viewing")}</span>
              <Badge variant="secondary" className="font-medium">
                <Building2 className="mr-1 size-3.5" />
                {activeBusiness.name}
              </Badge>
            </div>
          )}
        </div>

        {/* Current subscription plan badge; upgrade / change plan CTA */}
        {!subscriptionLoading ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <SubscriptionPlanBadge planSlug={currentPlanSlug} planName={currentPlan?.name} />
            {!planInheritedFromBusiness && isFreePlan ? (
              <Button asChild size="sm" variant="default" className="gap-1.5">
                <Link href={upgradeHref}>
                  <Zap className="size-3.5" />
                  {t("dashboard.common.upgrade")}
                </Link>
              </Button>
            ) : !planInheritedFromBusiness ? (
              <Button asChild size="sm" variant="outline">
                <Link href={changePlanHref}>{t("dashboard.common.changePlan")}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ────── Complete your profile banner ────── */}
      {!isProfileComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-full">
                  <UserRound className="text-primary size-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl">
                    {t("dashboard.home.completeProfileTitle")}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t("dashboard.home.completeProfileDescription")}
                  </CardDescription>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/onboarding" className="gap-2">
                  {t("dashboard.home.completeProfileCta")}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* ────── Profile Card ────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="flex min-w-1/3 flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar
                name={profile?.full_name || undefined}
                image={profile?.avatar_url}
                size="xl"
                className="border-border border-2"
              />
              <div className="">
                <CardTitle className="text-xl wrap-break-word sm:text-2xl">
                  {profile?.full_name || profile?.email || t("dashboard.common.yourAccount")}
                </CardTitle>
                <div className="text-muted-foreground flex items-center gap-x-2 gap-y-1 text-sm">
                  {profile?.email && <span>{profile.email}</span>}
                  {profile?.phone && (
                    <>
                      <span>•</span>
                      <span>{profile.phone}</span>
                    </>
                  )}
                  {/* {profile?.created_at && (
                    <>
                      <span>•</span>
                      <span>
                        Member since{" "}
                        {new Date(profile.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  )} */}
                </div>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
              {!isStaff && !businessesLoading && businesses.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full min-w-0 justify-between lg:w-auto lg:max-w-xs lg:min-w-44"
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        <Building2 className="size-4 shrink-0" />
                        <span className="truncate">
                          {activeBusiness?.name ?? t("dashboard.common.selectBusiness")}
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    {businesses.map((biz) => {
                      const isActive = biz.id === currentBusinessId;
                      return (
                        <DropdownMenuItem
                          key={biz.id}
                          onClick={() => setCurrentBusiness(biz.id)}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{biz.name}</span>
                          {isActive && <Check className="size-4 shrink-0" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button asChild variant="outline" size="sm" className="w-full shrink-0 lg:w-auto">
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 size-4" />
                  {t("dashboard.common.settings")}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        {showDashboard ? (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-sm">{t("dashboard.common.totalSales")}</p>
                {statsLoading ? (
                  <DashboardStatSkeleton />
                ) : (
                  <p className="text-lg font-bold wrap-break-word tabular-nums">
                    {formatAmount(salesStats.totalSales, {
                      decimalDigits: 0,
                    })}
                  </p>
                )}
              </div>
              {showProfits ? (
                <div className="min-w-0 space-y-1">
                  <p className="text-muted-foreground text-sm">
                    {t("dashboard.common.totalProfit")}
                  </p>
                  {statsLoading ? (
                    <DashboardStatSkeleton />
                  ) : (
                    <p className="text-lg font-bold wrap-break-word tabular-nums">
                      {formatAmount(salesStats.totalProfit, { decimalDigits: 0 })}
                    </p>
                  )}
                </div>
              ) : null}
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-sm">
                  {t("dashboard.common.totalProducts")}
                </p>
                {statsLoading ? (
                  <DashboardStatSkeleton size="count" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">{productCount}</p>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-sm">
                  {t("dashboard.common.totalClients")}
                </p>
                {statsLoading ? (
                  <DashboardStatSkeleton size="count" />
                ) : (
                  <p className="text-lg font-bold tabular-nums">{clientCount}</p>
                )}
              </div>
              {showInvoices ? (
                <>
                  <div className="min-w-0 space-y-1">
                    <p className="text-muted-foreground text-sm">
                      {t("dashboard.common.totalInvoices")}
                    </p>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="count" />
                    ) : (
                      <p className="text-lg font-bold tabular-nums">{invoiceStats.total}</p>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-muted-foreground text-sm">
                      {t("dashboard.common.totalQuotations")}
                    </p>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="count" />
                    ) : (
                      <p className="text-lg font-bold tabular-nums">{quotationCount}</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        ) : null}
      </Card>

      {showDashboard ? (
        <>
          {/* ────── Core POS Stats ────── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.common.todaysSales")}
                </CardTitle>
                <ShoppingCart className="size-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <DashboardStatSkeleton className="h-6 w-28" />
                ) : (
                  <div className="text-xl font-bold">
                    {formatAmount(salesStats.todaySales, { decimalDigits: 0 })}
                  </div>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("dashboard.common.salesDatedToday")}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/sales">{t("dashboard.common.viewSales")}</Link>
                </Button>
              </CardFooter>
            </Card>

            {showProfits ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t("dashboard.common.todaysProfit")}
                  </CardTitle>
                  <TrendingUp className="size-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <DashboardStatSkeleton className="h-6 w-28" />
                  ) : (
                    <div className="text-xl font-bold">
                      {formatAmount(salesStats.todayProfit, { decimalDigits: 0 })}
                    </div>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("dashboard.common.profitDatedToday")}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/dashboard/profits">{t("dashboard.common.viewProfit")}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.common.todaysExpenses")}
                </CardTitle>
                <Wallet className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <DashboardStatSkeleton className="h-6 w-28" />
                ) : (
                  <div className="text-xl font-bold">
                    {formatAmount(salesStats.todayExpenses, { decimalDigits: 0 })}
                  </div>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("dashboard.common.expensesDatedToday")}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/expenses">{t("dashboard.common.viewExpenses")}</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard.common.inventoryValue")}
                </CardTitle>
                <Package className="size-4 text-violet-600" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <DashboardStatSkeleton className="h-6 w-28" />
                ) : (
                  <div className="text-xl font-bold">
                    {formatAmount(inventoryStats.inventoryValue, { decimalDigits: 0 })}
                  </div>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("dashboard.common.stockAtBasePrice")}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/products">{t("dashboard.common.manageInventory")}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {showInvoices ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.common.invoiceStats")}</CardTitle>
                <CardDescription>{t("dashboard.common.invoiceStatsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <Link href="/dashboard/invoices?status=paid" className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("dashboard.status.paid")}</p>
                      <CheckCircle2 className="size-4 text-green-600" />
                    </div>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="lg" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold">{invoiceStats.paid}</p>
                    )}
                  </Link>
                  <Link href="/dashboard/invoices?status=sent" className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("dashboard.status.sent")}</p>
                      <Send className="size-4 text-blue-600" />
                    </div>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="lg" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold">{invoiceStats.sent}</p>
                    )}
                  </Link>
                  <Link href="/dashboard/invoices?status=overdue" className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("dashboard.status.overdue")}</p>
                      <AlertTriangle className="text-destructive size-4" />
                    </div>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="lg" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold">{invoiceStats.overdue}</p>
                    )}
                  </Link>
                  <Link href="/dashboard/invoices?status=draft" className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("dashboard.common.drafts")}</p>
                      <Clock className="size-4 text-yellow-600" />
                    </div>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="lg" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold">{invoiceStats.draft}</p>
                    )}
                  </Link>
                  <Link href="/dashboard/invoices" className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t("dashboard.common.total")}</p>
                      <FileText className="text-muted-foreground size-4" />
                    </div>
                    {statsLoading ? (
                      <DashboardStatSkeleton size="lg" className="mt-2" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold">{invoiceStats.total}</p>
                    )}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {/* ────── Quick Actions + Account Summary ────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.common.quickActions")}</CardTitle>
            <CardDescription>{t("dashboard.common.commonTasks")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissions.can("sales", "create") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/sales/create">
                  <ShoppingCart className="mr-2 size-4" />
                  {t("dashboard.common.recordSale")}
                </Link>
              </Button>
            ) : null}
            {permissions.can("invoices", "create") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/invoices/create">
                  <Plus className="mr-2 size-4" />
                  {t("dashboard.common.createInvoice")}
                </Link>
              </Button>
            ) : null}
            {permissions.can("clients", "view") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/clients">
                  <Users className="mr-2 size-4" />
                  {t("dashboard.common.manageClients")}
                </Link>
              </Button>
            ) : null}
            {permissions.can("loans", "view") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/loans">
                  <Users className="mr-2 size-4" />
                  {t("dashboard.common.manageLoans")}
                </Link>
              </Button>
            ) : null}
            {permissions.can("invoices", "view") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/invoices">
                  <FileText className="mr-2 size-4" />
                  {t("dashboard.common.allInvoices")}
                </Link>
              </Button>
            ) : null}
            {permissions.can("quotations", "view") ? (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/quotations">
                  <Quote className="mr-2 size-4" />
                  {t("dashboard.common.quotations")}
                </Link>
              </Button>
            ) : null}
            <Separator className="my-2" />
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 size-4" />
                {t("dashboard.common.settings")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.common.accountSummary")}</CardTitle>
            <CardDescription>{t("dashboard.common.accountOverview")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("dashboard.common.phoneVerified")}
              </span>
              <span className="text-sm font-medium">
                {profile?.phone ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="size-3.5" /> {t("dashboard.common.yesVerified")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="size-3.5" /> {t("dashboard.common.notYet")}
                  </span>
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("dashboard.common.profileComplete")}
              </span>
              <span className="text-sm font-medium">
                {isProfileComplete ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="size-3.5" /> {t("dashboard.common.yesVerified")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="size-3.5" /> {t("dashboard.common.incomplete")}
                  </span>
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t("dashboard.common.memberSince")}
              </span>
              <span className="text-sm font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
