"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import {
  useSubscriptionPlans,
  formatPlanFeature,
  type SubscriptionPlanSlug,
} from "@/hooks/use-subscription-plans";
import { useSetSubscription } from "@/hooks/use-set-subscription";
import { useTranslation } from "@/hooks/use-translation";
import { Check, Loader2, ArrowRight, Mail, Users, Cloud, Zap } from "lucide-react";
import { SUPPORT_EMAIL } from "@/constants/values";
import { ToastAlert } from "@/config/toast";

const PLAN_ICONS: Record<SubscriptionPlanSlug, typeof Users> = {
  free: Users,
  pro: Zap,
  business: Cloud,
};

const formatPriceDisplay = (amount: number | null, currency: string | null) => {
  if (amount === null || amount === undefined) return null;
  if (amount === 0) return "$0";
  const symbol = currency === "USD" ? "$" : (currency ?? "$");
  return `${symbol}${Number(amount).toFixed(2)}`;
};

const SubscribeContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan") as SubscriptionPlanSlug | null;
  const fromOnboarding = searchParams.get("from") === "onboarding";

  const { user, loading: authLoading } = useUser();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const setSubscription = useSetSubscription();

  const [selectedSlug, setSelectedSlug] = useState<SubscriptionPlanSlug | null>(
    planParam && ["free", "pro", "business"].includes(planParam) ? planParam : null,
  );

  useEffect(() => {
    if (planParam && ["free", "pro", "business"].includes(planParam)) {
      setSelectedSlug(planParam as SubscriptionPlanSlug);
    }
  }, [planParam]);

  // Redirect unauthenticated users to login, preserving return URL
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = `/subscribe${planParam ? `?plan=${planParam}` : ""}${fromOnboarding ? `${planParam ? "&" : "?"}from=onboarding` : ""}`;
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, authLoading, router, planParam, fromOnboarding]);

  const selectedPlan = plans?.find((p) => p.slug === selectedSlug);
  const isFree = selectedPlan?.slug === "free";
  const isContactSales = selectedPlan?.is_contact_sales ?? false;

  const handleContinueWithFree = () => {
    if (!user || !selectedPlan) return;
    setSubscription.mutate(
      { planSlug: "free", userId: user.id },
      {
        onSuccess: () => {
          ToastAlert.success("You're on the Free plan.");
          router.push("/dashboard");
        },
        onError: (e) => {
          ToastAlert.error(e instanceof Error ? e.message : "Failed to set plan");
        },
      },
    );
  };

  const handleSkip = () => {
    if (!user) {
      router.push("/dashboard");
      return;
    }
    setSubscription.mutate(
      { planSlug: "free", userId: user.id },
      {
        onSuccess: () => {
          ToastAlert.success("You can upgrade anytime from settings.");
          router.push("/dashboard");
        },
        onError: () => {
          router.push("/dashboard");
        },
      },
    );
  };

  const handleContinueToPayment = () => {
    // TODO: Integrate Snippe Payment API
    // 1. Create payment: POST https://api.snippe.sh/v1/payments (Authorization: Bearer API_KEY, Idempotency-Key)
    // 2. Redirect customer: card → payment_url; mobile → USSD; dynamic-qr → payment_qr_code
    // 3. Handle webhook to confirm payment, then create subscription_payments + set subscription
    // Docs: https://docs.snippe.sh/docs/2026-01-25
    ToastAlert.error("Payment integration coming soon. You'll be redirected to complete payment.");
  };

  if (authLoading || !user) {
    return (
      <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-8">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" />
        </div>

        {fromOnboarding && (
          <div className="mb-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        )}

        <div className="bg-background rounded-4xl border p-6 sm:p-8">
          <h1 className="text-foreground mb-1 text-center text-2xl font-semibold">
            Choose your plan
          </h1>
          <p className="text-muted-foreground mb-6 text-center text-sm">
            {fromOnboarding
              ? "Get started with the right plan for your business. You can change or skip for now."
              : "Select a plan to continue. You can change it anytime."}
          </p>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {plans?.map((plan) => {
                const slug = plan.slug as SubscriptionPlanSlug;
                const Icon = PLAN_ICONS[slug];
                const popular = slug === "pro";
                const isSelected = selectedSlug === slug;
                const contact = plan.is_contact_sales;
                const priceStr = formatPriceDisplay(plan.price_amount, plan.price_currency);
                const period =
                  plan.billing_interval === "monthly"
                    ? "/month"
                    : plan.billing_interval === "yearly"
                      ? "/year"
                      : "";

                return (
                  <Card
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    className={`relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-primary/20 ring-2"
                        : "bg-card hover:border-primary/30 shadow-xs"
                    }`}
                    onClick={() => setSelectedSlug(slug)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedSlug(slug);
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
                        {plan.description ?? t(`landing.pricing.${slug}.description`)}
                      </p>
                      {!contact ? (
                        <div className="flex items-baseline gap-1 pt-2">
                          <span className="text-foreground text-3xl font-bold md:text-4xl">
                            {priceStr ?? t(`landing.pricing.${slug}.price`)}
                          </span>
                          <span className="text-muted-foreground">{period}</span>
                        </div>
                      ) : (
                        <p className="text-foreground pt-2 text-lg font-semibold">
                          {t("landing.pricing.contactUs")}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-0">
                      <ul className="flex-1 space-y-3">
                        {plan.features.length > 0
                          ? plan.features.map((f) => (
                              <li
                                key={f.id}
                                className="text-muted-foreground flex items-start gap-2 text-sm"
                              >
                                <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                                <span>{formatPlanFeature(f)}</span>
                              </li>
                            ))
                          : [
                              t(`landing.pricing.${slug}.features.0`),
                              t(`landing.pricing.${slug}.features.1`),
                              t(`landing.pricing.${slug}.features.2`),
                              t(`landing.pricing.${slug}.features.3`),
                            ].map((feature, i) => (
                              <li
                                key={i}
                                className="text-muted-foreground flex items-start gap-2 text-sm"
                              >
                                <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedPlan && (
            <div className="mt-6 flex flex-col gap-3">
              {isContactSales ? (
                <Button asChild size="lg" className="w-full">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                      "Business plan inquiry",
                    )}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Contact us for Business plan
                  </a>
                </Button>
              ) : isFree ? (
                <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-center">
                  <p className="text-muted-foreground text-sm">
                    You’re on the Free plan. Upgrade above when you need more.
                  </p>
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={handleContinueToPayment}>
                  Continue to payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              {fromOnboarding && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkip}
                  disabled={setSubscription.isPending}
                >
                  Skip for now — start with Free
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
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
