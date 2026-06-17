"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Package } from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentSubscription } from "@/hooks/use-current-subscription";
import { useUser } from "@/hooks/use-user";
import { getPlanTier } from "@/hooks/use-subscription-plans";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ReportsIcon } from "@/components/icons/reports-icon";
import { ReportHubCard } from "@/components/reports/report-hub-card";
import {
  REPORT_HUB_ITEMS,
  REPORTS_EMPTY_NO_BUSINESS,
  REPORTS_SCREEN,
  REPORTS_UPGRADE_REQUIRED,
} from "@/constants/reports";
import { getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";

const REPORT_HUB_ICONS = {
  "product-sales": Package,
} as const;

const ReportsHubPage = () => {
  const { user } = useUser();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { data: subscription, isLoading: subscriptionLoading } = useCurrentSubscription(user?.id);

  const activeBusiness =
    businesses.find((business) => business.id === currentBusinessId) ?? businesses[0] ?? null;
  const planTier = getPlanTier(subscription?.planSlug);
  const hasReportAccess = planTier !== "free";
  const accessLoading = subscriptionLoading;

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  if (businessesLoading || accessLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">{REPORTS_SCREEN.title}</h1>
          <p className="text-muted-foreground text-sm">{REPORTS_SCREEN.subtitle}</p>
        </div>
        <Card>
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
            <ReportsIcon className="text-muted-foreground size-12" />
            <div className="space-y-1">
              <p className="font-medium">{REPORTS_EMPTY_NO_BUSINESS.title}</p>
              <p className="text-muted-foreground text-sm">{REPORTS_EMPTY_NO_BUSINESS.description}</p>
            </div>
            <Button asChild>
              <Link href={REPORTS_EMPTY_NO_BUSINESS.actionHref}>
                {REPORTS_EMPTY_NO_BUSINESS.actionLabel}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{REPORTS_SCREEN.title}</h1>
          <p className="text-muted-foreground text-sm">
            {activeBusiness
              ? REPORTS_SCREEN.businessSubtitle(activeBusiness.name)
              : REPORTS_SCREEN.subtitle}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            {hasReportAccess
              ? "Choose a report to explore product and sales performance."
              : "Upgrade your plan to unlock performance reports."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasReportAccess ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {REPORT_HUB_ITEMS.map((item) => {
                const Icon =
                  REPORT_HUB_ICONS[item.slug as keyof typeof REPORT_HUB_ICONS] ?? Package;

                return (
                  <ReportHubCard
                    key={item.slug}
                    title={item.title}
                    description={item.description}
                    href={item.href}
                    icon={Icon}
                    iconClassName="text-blue-600"
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 py-12 text-center">
              <ReportsIcon className="text-muted-foreground size-12" />
              <div className="max-w-md space-y-1">
                <p className="font-medium">{REPORTS_UPGRADE_REQUIRED.title}</p>
                <p className="text-muted-foreground text-sm">{REPORTS_UPGRADE_REQUIRED.description}</p>
              </div>
              <Button asChild>
                <Link href={getSubscribeUrlForPlanLimit("PLAN_LIMIT:product_sales_reports")}>
                  {REPORTS_UPGRADE_REQUIRED.actionLabel}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsHubPage;
