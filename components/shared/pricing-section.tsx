"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { Check, Users, Cloud, Zap, Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "@/constants/values";

const SNIPE_URL = "https://snipe.sh";

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
    <section
      id="pricing"
      className="py-12 md:py-16 px-4 border-t border-border/60 bg-muted/20"
    >
      <div className="container w-full md:max-w-6xl mx-auto">
        <h2 className="capitalize text-2xl md:text-3xl xl:text-5xl font-semibold text-foreground text-center mb-12 md:mb-16">
          {t("landing.pricing.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
                className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all ${
                  popular
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 md:scale-[1.02]"
                    : "border bg-card shadow-xs hover:border-primary/30"
                }`}
              >
                {popular && (
                  <div className="absolute top-0 right-0 px-3 py-1.5 rounded-bl-lg bg-primary text-primary-foreground text-xs font-medium">
                    {t("landing.pricing.mostPopular")}
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-xl md:text-2xl font-semibold">
                      {name}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {!contact ? (
                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl md:text-4xl font-bold text-foreground">
                        {price}
                      </span>
                      <span className="text-muted-foreground">{period}</span>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-foreground pt-2">
                      {t("landing.pricing.contactUs")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pt-0">
                  <ul className="space-y-3 flex-1">
                    {features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={popular ? "default" : "outline"}
                    className={`w-full mt-6 rounded-lg py-6 font-medium ${
                      popular ? "bg-primary" : ""
                    }`}
                    size="lg"
                  >
                    {contact ? (
                      <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                          `Business plan inquiry`
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

        <p className="text-center text-muted-foreground text-md mt-10 uppercase">
          {t("landing.pricing.noHiddenFees")}
        </p>

        {/* Powered by Snipe */}
        <div className="mt-5 py-4 flex flex-col items-center gap-2">
          <p className="text-2xl text-muted-foreground">
            {t("landing.pricing.poweredBy")}{" "}
            <a
              href={SNIPE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Snipe
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export { PricingSection };
