"use client";

import { useTranslation } from "@/hooks/use-translation";
import { BarChart3, FileText, PackageCheck, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import {
  landingFadeUpTight,
  landingStaggerParent,
  landingViewport,
  ScrollReveal,
} from "@/components/shared/scroll-reveal";

const SimplePowerfulSection = () => {
  const { t } = useTranslation();

  const items = [
    {
      icon: ShoppingCart,
      text: t("landing.simpleSection.createInvoices"),
    },
    {
      icon: PackageCheck,
      text: t("landing.simpleSection.sendAndTrack"),
    },
    {
      icon: FileText,
      text: t("landing.simpleSection.acceptPayments"),
    },
    {
      icon: BarChart3,
      text: t("landing.simpleSection.monitorStatus"),
    },
  ];

  return (
    <section id="features" className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16">
      <div className="container mx-auto w-full md:max-w-4xl">
        <ScrollReveal as="h2" className="text-foreground mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-3xl xl:text-4xl">
          {t("landing.simpleSection.title")}
        </ScrollReveal>
        <motion.ul
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-8"
          variants={landingStaggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={landingViewport}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={index}
                variants={landingFadeUpTight}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="dark:bg-primary/5 border-border/50 dark:border-primary/10 hover:border-primary/30 flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors"
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
