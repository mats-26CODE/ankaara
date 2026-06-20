"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { useCurrentSubscription } from "@/hooks/use-current-subscription";
import {
  useSubscriptionPlans,
  getPlanTier,
  groupPlansByTier,
  type SubscriptionPlanSlug,
  type SubscriptionPlanWithFeatures,
} from "@/hooks/use-subscription-plans";
import { useSetSubscription } from "@/hooks/use-set-subscription";
import {
  canCheckoutPlan,
  getNextPlanSlug,
  getPlanLimitReachedMessage,
  isBillingIntervalChange,
  isExactSamePlan,
  isPlanDowngrade,
} from "@/lib/subscription-limits";
import {
  getBillingIntervalChangeNote,
  getSubscribeIntervalLabel,
} from "@/constants/subscribe";
import { getSubscribePeriodSuffix } from "@/lib/i18n/subscribe-helpers";
import { ContactUsToUpgradeDialog } from "@/components/shared/contact-us-to-upgrade-dialog";
import { PlanFeaturesList } from "@/components/shared/plan-features-list";
import { formatPlanCurrency } from "@/lib/format-plan-currency";
import { useTranslation } from "@/hooks/use-translation";
import { Loader2, ArrowRight, ArrowLeft, Users, Cloud, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastAlert } from "@/config/toast";

const PLAN_TIER_ICONS: Record<ReturnType<typeof getPlanTier>, typeof Users> = {
  free: Users,
  pro: Zap,
  business: Cloud,
};

const getDefaultPlanSlugForTier = (
  tierPlans: SubscriptionPlanWithFeatures[],
): SubscriptionPlanSlug =>
  (tierPlans.find((p) => p.billing_interval === "monthly") ?? tierPlans[0])!
    .slug as SubscriptionPlanSlug;

const SubscribeContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan"); // URL can be "pro" (shorthand) or a full slug
  const limitParam = searchParams.get("limit");
  const fromOnboarding = searchParams.get("from") === "onboarding";

  const { user, loading: authLoading } = useUser();
  const { data: subscription } = useCurrentSubscription(user?.id);
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const setSubscription = useSetSubscription();

  const [selectedSlug, setSelectedSlug] = useState<SubscriptionPlanSlug | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    if (planParam) {
      const validSlugs: SubscriptionPlanSlug[] = [
        "free",
        "pro-monthly",
        "pro-6month",
        "pro-yearly",
        "business",
        "business-monthly",
        "business-6month",
        "business-yearly",
      ];
      const slug: SubscriptionPlanSlug | null =
        planParam === "pro"
          ? "pro-monthly"
          : validSlugs.includes(planParam as SubscriptionPlanSlug)
            ? (planParam as SubscriptionPlanSlug)
            : null;
      if (slug) setSelectedSlug(slug);
      return;
    }
    if (limitParam && subscription?.planSlug) {
      setSelectedSlug(getNextPlanSlug(subscription.planSlug));
      return;
    }
    if (fromOnboarding) {
      setSelectedSlug((prev) => (prev === null ? "pro-monthly" : prev));
      return;
    }
    if (subscription?.planSlug) {
      setSelectedSlug((prev) => (prev === null ? subscription.planSlug : prev));
    }
  }, [planParam, limitParam, subscription?.planSlug, fromOnboarding]);

  // Redirect unauthenticated users to login, preserving return URL
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const params = new URLSearchParams();
      if (planParam) params.set("plan", planParam);
      if (limitParam) params.set("limit", limitParam);
      if (fromOnboarding) params.set("from", "onboarding");
      const qs = params.toString();
      const redirect = `/subscribe${qs ? `?${qs}` : ""}`;
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, authLoading, router, planParam, limitParam, fromOnboarding]);

  const currentPlanSlug = (subscription?.planSlug ?? "free") as SubscriptionPlanSlug;
  const currentPlanEndDate = subscription?.endDate ?? null;

  const selectedPlan = plans?.find((p) => p.slug === selectedSlug);
  const isFree = selectedPlan?.slug === "free";
  const isCurrentSelection =
    selectedSlug != null && isExactSamePlan(currentPlanSlug, selectedSlug);
  const isBillingChangeSelection =
    selectedSlug != null && isBillingIntervalChange(currentPlanSlug, selectedSlug);
  const canCheckoutSelection =
    selectedSlug != null && canCheckoutPlan(currentPlanSlug, selectedSlug);
  const isDowngradeSelection =
    selectedSlug != null && isPlanDowngrade(currentPlanSlug, selectedSlug);

  const handleSkip = () => {
    if (!user) {
      router.push("/dashboard");
      return;
    }
    setSubscription.mutate(
      { planSlug: "free", userId: user.id },
      {
        onSuccess: () => {
          ToastAlert.success(t("dashboard.subscription.page.upgradeAnytime"));
          router.push("/dashboard");
        },
        onError: () => {
          router.push("/dashboard");
        },
      },
    );
  };

  const handleContinueToPayment = () => {
    setContactDialogOpen(true);
  };

  if (authLoading || !user) {
    return (
      <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-8">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">{t("dashboard.subscription.page.loading")}</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="relative mb-6 flex items-center justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="absolute left-0 rounded-full"
          >
            <ArrowLeft className="mr-1 size-4" />
            {t("dashboard.subscription.page.goBack")}
          </Button>
          <Logo size="sm" />
        </div>

        <div className="bg-background rounded-4xl border p-6 sm:p-8">
          <h1 className="text-foreground mb-1 text-center text-2xl font-semibold">
            {t("dashboard.subscription.page.title")}
          </h1>
          <p className="text-muted-foreground mb-6 text-center text-sm">
            {fromOnboarding
              ? t("dashboard.subscription.page.onboardingSubtitle")
              : t("dashboard.subscription.page.subtitle")}
          </p>

          {limitParam && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {getPlanLimitReachedMessage(limitParam)}
            </div>
          )}

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : (
            (() => {
              const grouped = groupPlansByTier(plans ?? []);
              const renderPlanCard = (
                plan: SubscriptionPlanWithFeatures,
                tier: ReturnType<typeof getPlanTier>,
                isSelected: boolean,
                onSelect: () => void,
              ) => {
                const Icon = PLAN_TIER_ICONS[tier];
                const popular = tier === "pro";
                const priceStr = formatPlanCurrency(plan.price_amount, plan.price_currency);
                const period = getSubscribePeriodSuffix(plan.billing_interval);
                return (
                  <Card
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 transition-all",
                      isSelected
                        ? "border-primary ring-primary/20 ring-2"
                        : "bg-card hover:border-primary/30 shadow-xs",
                    )}
                    onClick={onSelect}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect();
                      }
                    }}
                  >
                    {popular && (
                      <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-3 py-1.5 text-xs font-medium">
                        {t("landing.pricing.mostPopular")}
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                          <Icon className="h-5 w-5" />
                        </span>
                        <CardTitle className="text-xl font-semibold md:text-2xl">
                          {plan.name}
                        </CardTitle>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {plan.description ?? t(`landing.pricing.${tier}.description`)}
                      </p>
                      <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-foreground text-3xl font-bold md:text-4xl">
                          {priceStr ?? t(`landing.pricing.${tier}.price`)}
                        </span>
                        <span className="text-muted-foreground">{period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-0">
                      <PlanFeaturesList features={plan.features} tier={tier} />
                    </CardContent>
                  </Card>
                );
              };

              const renderTierCardWithTabs = (
                tier: "pro" | "business",
                tierPlans: SubscriptionPlanWithFeatures[],
                tierLabel: string,
              ) => {
                if (tierPlans.length === 0) return null;

                const isCurrentTier = getPlanTier(currentPlanSlug) === tier;
                const currentTierSlug =
                  isCurrentTier && tierPlans.some((p) => p.slug === currentPlanSlug)
                    ? currentPlanSlug
                    : null;

                const activeSlug =
                  selectedSlug && tierPlans.some((p) => p.slug === selectedSlug)
                    ? selectedSlug
                    : currentTierSlug ?? (tierPlans[0]?.slug as SubscriptionPlanSlug);
                const activePlan = tierPlans.find((p) => p.slug === activeSlug) ?? tierPlans[0]!;
                const Icon = PLAN_TIER_ICONS[tier];
                const popular = tier === "pro";
                const isTierSelected = selectedSlug != null && getPlanTier(selectedSlug) === tier;
                const selectTier = () =>
                  setSelectedSlug(currentTierSlug ?? getDefaultPlanSlugForTier(tierPlans));
                return (
                  <Card
                    key={tier}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 transition-all",
                      isTierSelected
                        ? "border-primary ring-primary/20 ring-2"
                        : "bg-card hover:border-primary/30 shadow-xs",
                    )}
                    onClick={selectTier}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectTier();
                      }
                    }}
                  >
                    {popular && (
                      <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl-lg px-3 py-1.5 text-xs font-medium">
                        {t("landing.pricing.mostPopular")}
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                          <Icon className="h-5 w-5" />
                        </span>
                        <CardTitle className="text-xl font-semibold md:text-2xl">
                          {tierLabel}
                        </CardTitle>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {t(`landing.pricing.${tier}.description`)}
                      </p>
                      <Tabs
                        value={activeSlug}
                        onValueChange={(v) => setSelectedSlug(v as SubscriptionPlanSlug)}
                        className="mt-3 w-full"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          {tierPlans.map((p) => (
                            <TabsTrigger
                              key={p.id}
                              value={p.slug}
                              className="text-xs sm:text-sm"
                            >
                              {getSubscribeIntervalLabel(p.billing_interval)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {tierPlans.map((p) => (
                          <TabsContent
                            key={p.id}
                            value={p.slug}
                            className="mt-3 focus-visible:outline-none"
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-foreground text-2xl font-bold md:text-3xl">
                                {formatPlanCurrency(p.price_amount, p.price_currency) ??
                                  t(`landing.pricing.${tier}.price`)}
                              </span>
                              <span className="text-muted-foreground">
                                {getSubscribePeriodSuffix(p.billing_interval)}
                              </span>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-0">
                      <PlanFeaturesList features={activePlan.features} tier={tier} />
                    </CardContent>
                  </Card>
                );
              };

              return (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                  {grouped.free && (
                    <div key="free">
                      {renderPlanCard(
                        grouped.free,
                        "free",
                        selectedSlug === "free",
                        () => setSelectedSlug("free"),
                      )}
                    </div>
                  )}
                  {grouped.pro.length > 0 &&
                    renderTierCardWithTabs(
                      "pro",
                      grouped.pro,
                      t("landing.pricing.pro.name") ?? "Pro Plan",
                    )}
                  {grouped.business.length > 0 &&
                    renderTierCardWithTabs(
                      "business",
                      grouped.business,
                      t("landing.pricing.business.name") ?? "Business Plan",
                    )}
                </div>
              );
            })()
          )}

          {selectedPlan && (
            <div className="mt-6 flex flex-col gap-3">
              {isCurrentSelection ? (
                <div className="border-muted bg-muted/30 rounded-lg border px-4 py-3 text-center">
                  <p className="text-muted-foreground text-sm">
                    {isFree
                      ? t("dashboard.subscription.notes.freePlan")
                      : t("dashboard.subscription.notes.currentPlan")}
                  </p>
                </div>
              ) : isDowngradeSelection ? (
                <div className="border-muted bg-muted/30 rounded-lg border px-4 py-3 text-center">
                  <p className="text-muted-foreground text-sm">
                    {t("dashboard.subscription.notes.downgrade")}
                  </p>
                </div>
              ) : canCheckoutSelection ? (
                <>
                  {isBillingChangeSelection ? (
                    <div className="border-muted bg-muted/30 rounded-lg border px-4 py-3 text-center">
                      <p className="text-muted-foreground text-sm">
                        {getBillingIntervalChangeNote(currentPlanEndDate)}
                      </p>
                    </div>
                  ) : null}
                  <Button size="lg" className="w-full" onClick={handleContinueToPayment}>
                    {t("dashboard.subscription.page.continuePayment")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : null}

              {fromOnboarding && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkip}
                  disabled={setSubscription.isPending}
                >
                  {t("dashboard.subscription.page.skipFree")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ContactUsToUpgradeDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        planName={selectedPlan?.name}
        intervalLabel={getSubscribeIntervalLabel(selectedPlan?.billing_interval ?? null)}
      />
    </div>
  );
};

const SubscribePage = () => (
  <Suspense
    fallback={
      <div className="bg-muted/30 flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    }
  >
    <SubscribeContent />
  </Suspense>
);

export default SubscribePage;
