"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { Check, Users, Cloud, Zap, Mail, Loader2 } from "lucide-react";
import {
  PAYMENT_GATEWAY_NAME,
  PAYMENT_GATEWAY_URL,
  SUPPORT_EMAIL,
} from "@/constants/values";
import {
  useSubscriptionPlans,
  formatPlanFeature,
  type SubscriptionPlanSlug,
} from "@/hooks/use-subscription-plans";

const PLAN_ICONS: Record<SubscriptionPlanSlug, typeof Users> = {
  free: Users,
  pro: Zap,
  business: Cloud,
};

const PricingSection = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useUser();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();

  const formatPrice = (amount: number | null, currency: string | null) => {
    if (amount === null || amount === undefined) return null;
    if (amount === 0) return "$0";
    const symbol = currency === "USD" ? "$" : currency ?? "$";
    return `${symbol}${Number(amount).toFixed(2)}`;
  };

  if (plansLoading || !plans?.length) {
    return (
      <section
        id="pricing"
        className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16"
      >
        <div className="container mx-auto w-full md:max-w-6xl">
          <h2 className="text-foreground font-brand mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-4xl xl:text-5xl">
            {t("landing.pricing.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="flex flex-col overflow-hidden rounded-2xl border-2 border-muted"
              >
                <CardHeader className="pb-4">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                  </div>
                  <div className="bg-muted h-6 w-32 rounded" />
                  <div className="bg-muted mt-2 h-4 w-full rounded" />
                  <div className="bg-muted mt-2 h-8 w-24 rounded" />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-0">
                  <ul className="flex-1 space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <li
                        key={j}
                        className="bg-muted h-4 w-full rounded"
                      />
                    ))}
                  </ul>
                  <div className="bg-muted mt-6 h-12 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="pricing"
      className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16"
    >
      <div className="container mx-auto w-full md:max-w-6xl">
        <h2 className="text-foreground font-brand mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-4xl xl:text-5xl">
          {t("landing.pricing.title")}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {plans.map((plan) => {
            const slug = plan.slug as SubscriptionPlanSlug;
            const Icon = PLAN_ICONS[slug];
            const popular = slug === "pro";
            const contact = plan.is_contact_sales;
            const priceStr = formatPrice(plan.price_amount, plan.price_currency);
            const period =
              plan.billing_interval === "monthly"
                ? "/month"
                : plan.billing_interval === "yearly"
                  ? "/year"
                  : "";
            const cta = contact
              ? t("landing.pricing.contactUs")
              : t("landing.pricing.free.cta");
            const subscribeHref = `/subscribe?plan=${encodeURIComponent(slug)}`;
            const loginHref = `/login?redirect=${encodeURIComponent(subscribeHref)}`;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all ${
                  popular
                    ? "border-primary bg-primary/5 shadow-primary/10 shadow-lg md:scale-[1.02]"
                    : "bg-card hover:border-primary/30 border shadow-xs"
                }`}
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
                  {contact ? (
                    <Button
                      asChild
                      variant={popular ? "default" : "outline"}
                      className={`mt-6 w-full rounded-lg py-6 font-medium ${
                        popular ? "bg-primary" : ""
                      }`}
                      size="lg"
                    >
                      <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                          `Business plan inquiry`
                        )}`}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {cta}
                      </a>
                    </Button>
                  ) : slug === "free" ? (
                    <p className="text-muted-foreground mt-6 text-center text-sm">
                      {t("landing.pricing.free.name")} — default for new accounts
                    </p>
                  ) : authLoading ? (
                    <Button
                      variant={popular ? "default" : "outline"}
                      className={`mt-6 w-full rounded-lg py-6 font-medium ${
                        popular ? "bg-primary" : ""
                      }`}
                      size="lg"
                      disabled
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {cta}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant={popular ? "default" : "outline"}
                      className={`mt-6 w-full rounded-lg py-6 font-medium ${
                        popular ? "bg-primary" : ""
                      }`}
                      size="lg"
                    >
                      {user ? (
                        <Link href={subscribeHref}>{cta}</Link>
                      ) : (
                        <Link href={loginHref}>{cta}</Link>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-muted-foreground text-md mt-10 text-center uppercase">
          {t("landing.pricing.noHiddenFees")}
        </p>

        <div className="mt-5 flex flex-col items-center gap-2 py-4">
          <p className="text-muted-foreground text-center text-2xl">
            {t("landing.pricing.poweredBy")}{" "}
            <a
              href={PAYMENT_GATEWAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              {PAYMENT_GATEWAY_NAME}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export { PricingSection };
