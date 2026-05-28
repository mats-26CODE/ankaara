"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import {
  ChartColumnIncreasing,
  FileText,
  HandCoins,
  Package,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import {
  landingFadeUpTight,
  landingStaggerParent,
  landingViewport,
  ScrollReveal,
} from "@/components/shared/scroll-reveal";

export const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: ShoppingCart,
      title: t("landing.features.recordSales.title"),
      description: t("landing.features.recordSales.description"),
    },
    {
      icon: Package,
      title: t("landing.features.inventory.title"),
      description: t("landing.features.inventory.description"),
    },
    {
      icon: FileText,
      title: t("landing.features.invoicesQuotations.title"),
      description: t("landing.features.invoicesQuotations.description"),
    },
    {
      icon: HandCoins,
      title: t("landing.features.clientLoans.title"),
      description: t("landing.features.clientLoans.description"),
    },
    {
      icon: Wallet,
      title: t("landing.features.trackExpenses.title"),
      description: t("landing.features.trackExpenses.description"),
    },
    {
      icon: ChartColumnIncreasing,
      title: t("landing.features.profitDashboard.title"),
      description: t("landing.features.profitDashboard.description"),
    },
  ];

  return (
    <section id="features" className="border-border/60 bg-background border-t px-4 py-12 md:py-16">
      <div className="container mx-auto w-full md:max-w-6xl">
        <div className="mb-12 space-y-3 text-center md:mb-16">
          <ScrollReveal
            as="h2"
            eager
            className="text-foreground text-2xl font-semibold capitalize md:text-3xl xl:text-4xl"
          >
            {t("landing.features.title")}
          </ScrollReveal>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={landingStaggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={landingFadeUpTight}>
                <Card className="border-border/60 hover:border-primary/40 h-full transition-colors hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed md:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
