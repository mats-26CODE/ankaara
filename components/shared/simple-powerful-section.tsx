"use client";

import { useTranslation } from "@/hooks/use-translation";
import {
  ChartColumnIncreasing,
  FileText,
  HandCoins,
  PackageCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import {
  landingFadeUpTight,
  landingStaggerParent,
  ScrollReveal,
} from "@/components/shared/scroll-reveal";
import { useLandingMotion } from "@/hooks/use-landing-motion";

const SimplePowerfulSection = () => {
  const { t } = useTranslation();
  const { instant, motionInitial, viewport } = useLandingMotion({ belowHero: true });

  const items = [
    {
      icon: ShoppingCart,
      text: t("landing.simpleSection.recordSales"),
    },
    {
      icon: PackageCheck,
      text: t("landing.simpleSection.manageInventory"),
    },
    {
      icon: FileText,
      text: t("landing.simpleSection.invoicesAndQuotes"),
    },
    {
      icon: HandCoins,
      text: t("landing.simpleSection.clientLoans"),
    },
    {
      icon: Wallet,
      text: t("landing.simpleSection.trackExpenses"),
    },
    {
      icon: ChartColumnIncreasing,
      text: t("landing.simpleSection.profitDashboard"),
    },
  ];

  return (
    <section id="highlights" className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16">
      <div className="container mx-auto w-full md:max-w-5xl">
        <ScrollReveal
          as="h2"
          eager
          instant={instant}
          className="text-foreground mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-3xl xl:text-4xl"
        >
          {t("landing.simpleSection.title")}
        </ScrollReveal>
        <motion.ul
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 md:gap-6"
          variants={landingStaggerParent}
          initial={motionInitial}
          whileInView="visible"
          viewport={viewport}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={index}
                variants={landingFadeUpTight}
                className="dark:bg-primary/5 border-border/50 dark:border-primary/10 hover:border-primary/30 flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors md:hover:-translate-y-0.5"
              >
                <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-muted-foreground pt-1.5 text-base md:text-lg">
                  {item.text}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
};

export { SimplePowerfulSection };
