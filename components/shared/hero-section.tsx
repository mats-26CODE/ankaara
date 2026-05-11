"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { Quote, Star, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from "../ui/avatar";

const HeroSection = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const testimonialKeys = ["one", "two", "three"] as const;
  const trustMetrics = [
    {
      value: t("landing.trustMetrics.salesValue"),
      label: t("landing.trustMetrics.salesLabel"),
    },
    {
      value: t("landing.trustMetrics.inventoryValue"),
      label: t("landing.trustMetrics.inventoryLabel"),
    },
    {
      value: t("landing.trustMetrics.reportsValue"),
      label: t("landing.trustMetrics.reportsLabel"),
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Gradient overlay - theme-aware (works in light/dark) */}
      <div
        className="from-primary/15 via-primary/5 to-accent/10 absolute inset-0 -z-10 bg-linear-to-br"
        aria-hidden
      />
      <div className="container mx-auto w-full px-4 pt-16 pb-16 md:max-w-4xl">
        <div className="flex flex-col items-center space-y-4 text-center md:space-y-7">
          {/* Small label above headline */}
          <div className="dark:bg-primary/10 border-border dark:border-primary/10 rounded-full border bg-gray-100 px-4 py-2">
            <p className="text-muted-foreground dark:text-primary-foreground text-sm font-medium tracking-wide">
              {t("landing.heroLabel")}
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="text-foreground text-4xl leading-[1.1] font-bold tracking-tight text-balance capitalize md:text-5xl lg:text-7xl 2xl:text-8xl">
              {t("landing.headline")}
            </h1>

            <p className="text-muted-foreground mx-auto max-w-xl text-base text-pretty md:text-lg">
              {t("landing.subheadline")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 py-4 text-base font-medium shadow-lg"
            >
              {user ? (
                <Link href="/dashboard">{t("landing.ctaDashboard")}</Link>
              ) : (
                <Link href="/login">{t("landing.cta")}</Link>
              )}
            </Button>
            {!user && <p className="text-muted-foreground text-sm">{t("landing.noCreditCard")}</p>}
          </div>

          {/* Social proof */}
          <div className="flex flex-col items-center justify-center gap-5 md:flex-row">
            <AvatarGroup className="grayscale">
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
                <AvatarFallback>ER</AvatarFallback>
              </Avatar>
            </AvatarGroup>

            <div className="flex flex-col items-center justify-center space-y-2 md:items-start">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
              <p className="text-muted-foreground text-sm">{t("landing.socialProof")}</p>
            </div>
          </div>
        </div>

        {/* Trusted by + Testimonials */}
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur md:mt-18 md:p-6">
          <div
            className="from-primary/10 via-transparent to-accent/10 pointer-events-none absolute inset-0 bg-linear-to-br"
            aria-hidden
          />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t("landing.trustedBy")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing.socialProof")}</p>
              </div>

              <div className="grid grid-cols-3 overflow-hidden rounded-2xl border bg-background/70 text-center">
                {trustMetrics.map((metric) => (
                  <div key={metric.label} className="border-r px-3 py-3 last:border-r-0">
                    <p className="text-sm font-semibold text-foreground">{metric.value}</p>
                    <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {testimonialKeys.map((key, index) => (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border bg-background/85 p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                          aria-hidden
                        />
                      ))}
                    </div>
                    {index === 0 ? (
                      <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                    ) : (
                      <Quote className="h-4 w-4 text-primary" aria-hidden />
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-foreground">
                    &ldquo;{t(`landing.testimonials.${key}.quoteStart`)}
                    <strong className="font-semibold text-primary">
                      {t(`landing.testimonials.${key}.quoteHighlight`)}
                    </strong>
                    {t(`landing.testimonials.${key}.quoteEnd`)}&rdquo;
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <Avatar className="size-9 border border-border">
                      <AvatarImage src="" alt="" />
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {t(`landing.testimonials.${key}.name`)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {t(`landing.testimonials.${key}.name`)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`landing.testimonials.${key}.affiliation`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };
