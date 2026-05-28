"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { Quote, Star, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from "../ui/avatar";
import { motion } from "motion/react";
import {
  landingEase,
  landingFadeUp,
  landingFadeUpTight,
  landingStaggerParent,
  landingViewport,
} from "@/components/shared/scroll-reveal";
import { useLandingMotion } from "@/hooks/use-landing-motion";

const HERO_AVATARS = ["/avatar_one.png", "/avatar_two.png", "/avatar_three.png"] as const;

const HeroSection = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { instant, scrollViewport } = useLandingMotion();
  const testimonialKeys = ["one", "two", "three"] as const;
  const trustMetrics = [
    {
      value: t("landing.trustMetrics.salesValue"),
      label: t("landing.trustMetrics.salesLabel"),
    },
    {
      value: t("landing.trustMetrics.expensesValue"),
      label: t("landing.trustMetrics.expensesLabel"),
    },
    {
      value: t("landing.trustMetrics.profitValue"),
      label: t("landing.trustMetrics.profitLabel"),
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        className="from-primary/15 via-primary/5 to-accent/10 absolute inset-0 -z-10 bg-linear-to-br"
        aria-hidden
      />
      <div className="container mx-auto w-full px-4 pt-14 pb-14 md:max-w-5xl md:pt-16 md:pb-14">
        <motion.div
          className="flex flex-col items-center space-y-4 text-center md:space-y-6"
          variants={landingStaggerParent}
          initial={instant ? "visible" : "hidden"}
          animate="visible"
        >
          <motion.div
            variants={landingFadeUpTight}
            className="dark:bg-primary/10 border-border dark:border-primary/10 max-w-[min(100%,20rem)] rounded-full border bg-gray-100 px-3 py-1.5 sm:max-w-none sm:px-4 sm:py-2"
          >
            <p className="text-muted-foreground dark:text-primary-foreground text-xs font-medium tracking-wide text-balance sm:text-sm">
              {t("landing.heroLabel")}
            </p>
          </motion.div>

          <motion.div
            variants={landingFadeUp}
            className="mx-auto w-full max-w-2xl space-y-2 sm:space-y-2.5 md:max-w-3xl lg:max-w-4xl"
          >
            <h1 className="text-foreground text-3xl leading-[1.12] font-bold tracking-tight text-balance sm:text-4xl sm:leading-[1.1] md:text-5xl lg:text-6xl">
              {t("landing.headline")}
            </h1>

            <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base sm:leading-relaxed md:text-lg">
              {t("landing.subheadline")}
            </p>
            <p className="text-muted-foreground/90 text-xs leading-relaxed text-pretty sm:text-sm md:text-base">
              {t("landing.supportingText")}
            </p>
          </motion.div>

          <motion.div variants={landingFadeUp} className="flex flex-col items-center gap-4">
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
          </motion.div>

          <motion.div
            variants={landingFadeUp}
            className="flex flex-col items-center justify-center gap-5"
          >
            <AvatarGroup className="grayscale">
              {HERO_AVATARS.map((src, index) => {
                const key = testimonialKeys[index];
                const name = t(`landing.testimonials.${key}.name`);
                const initials = name
                  .split(" ")
                  .map((part) => part[0])
                  .join("");

                return (
                  <Avatar key={src} className="size-10">
                    <AvatarImage src={src} alt={name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                );
              })}
            </AvatarGroup>

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
              <p className="text-muted-foreground/90 text-xs leading-relaxed text-pretty sm:text-sm md:text-base">
                {t("landing.socialProof")}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-border/70 bg-card/70 relative mt-14 overflow-hidden rounded-3xl border p-4 shadow-sm md:mt-18 md:p-6 md:backdrop-blur"
          initial={instant ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewport}
          transition={{ duration: instant ? 0 : 0.4, ease: landingEase }}
        >
          <div
            className="from-primary/10 to-accent/10 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent"
            aria-hidden
          />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                  {t("landing.trustedBy")}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{t("landing.socialProof")}</p>
              </div>

              <div className="bg-background/70 grid grid-cols-3 overflow-hidden rounded-2xl border text-center">
                {trustMetrics.map((metric) => (
                  <div key={metric.label} className="border-r px-3 py-3 last:border-r-0">
                    <p className="text-foreground text-sm font-semibold">{metric.value}</p>
                    <p className="text-muted-foreground text-[11px]">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              variants={landingStaggerParent}
              initial={instant ? "visible" : "hidden"}
              whileInView="visible"
              viewport={scrollViewport}
              className="grid gap-3 md:grid-cols-3"
            >
              {testimonialKeys.map((key, index) => (
                <motion.div
                  key={key}
                  variants={landingFadeUpTight}
                  className="group bg-background/85 hover:border-primary/40 relative overflow-hidden rounded-2xl border p-4 text-left shadow-xs transition-colors md:hover:shadow-md"
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
                      <TrendingUp className="text-primary h-4 w-4" aria-hidden />
                    ) : (
                      <Quote className="text-primary h-4 w-4" aria-hidden />
                    )}
                  </div>

                  <p className="text-foreground text-sm leading-relaxed">
                    &ldquo;{t(`landing.testimonials.${key}.quoteStart`)}
                    <strong className="text-primary font-semibold">
                      {t(`landing.testimonials.${key}.quoteHighlight`)}
                    </strong>
                    {t(`landing.testimonials.${key}.quoteEnd`)}&rdquo;
                  </p>

                  <div className="mt-5 flex items-center gap-3">
                    <Avatar className="border-border size-9 border">
                      <AvatarImage
                        src={HERO_AVATARS[index]}
                        alt={t(`landing.testimonials.${key}.name`)}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {t(`landing.testimonials.${key}.name`)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">
                        {t(`landing.testimonials.${key}.name`)}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {t(`landing.testimonials.${key}.affiliation`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { HeroSection };
