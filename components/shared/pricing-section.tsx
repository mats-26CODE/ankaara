"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { Check, Users, Cloud, Zap, Mail } from "lucide-react";
import { PAYMENT_GATEWAY_NAME, PAYMENT_GATEWAY_URL, SUPPORT_EMAIL } from "@/constants/values";

const PricingSection = () => {
  const { t } = useTranslation();

  const plans = [
    {
      key: "free" as const,
      popular: false,
      contact: false,
      icon: Users,
    },
    {
      key: "pro" as const,
      popular: true,
      contact: false,
      icon: Zap,
    },
    {
      key: "business" as const,
      popular: false,
      contact: true,
      icon: Cloud,
    },
  ] as const;

  return (
    <section id="pricing" className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16">
      <div className="container mx-auto w-full md:max-w-6xl">
        <h2 className="text-foreground font-brand mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-4xl xl:text-5xl">
          {t("landing.pricing.title")}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {plans.map(({ key, popular, contact, icon: Icon }) => {
            const name = t(`landing.pricing.${key}.name`);
            const description = t(`landing.pricing.${key}.description`);
            const price = t(`landing.pricing.${key}.price`);
            const period = t(`landing.pricing.${key}.period`);
            const cta = t(`landing.pricing.${key}.cta`);
            const features = [
              t(`landing.pricing.${key}.features.0`),
              t(`landing.pricing.${key}.features.1`),
              t(`landing.pricing.${key}.features.2`),
              t(`landing.pricing.${key}.features.3`),
            ];

            return (
              <Card
                key={key}
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
                    <CardTitle className="text-xl font-semibold md:text-2xl">{name}</CardTitle>
                  </div>
                  <p className="text-muted-foreground text-sm">{description}</p>
                  {!contact ? (
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-foreground text-3xl font-bold md:text-4xl">
                        {price}
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
                    {features.map((feature, i) => (
                      <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
                        <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={popular ? "default" : "outline"}
                    className={`mt-6 w-full rounded-lg py-6 font-medium ${
                      popular ? "bg-primary" : ""
                    }`}
                    size="lg"
                  >
                    {contact ? (
                      <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                          `Business plan inquiry`,
                        )}`}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        {cta}
                      </a>
                    ) : (
                      <Link href="/sign-up">{cta}</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-muted-foreground text-md mt-10 text-center uppercase">
          {t("landing.pricing.noHiddenFees")}
        </p>

        {/* Powered by Snipe */}
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
