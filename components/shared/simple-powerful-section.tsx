"use client";

import { useTranslation } from "@/hooks/use-translation";
import {
  FileText,
  Send,
  CreditCard,
  BarChart3,
} from "lucide-react";

const SimplePowerfulSection = () => {
  const { t } = useTranslation();

  const items = [
    {
      icon: FileText,
      text: t("landing.simpleSection.createInvoices"),
    },
    {
      icon: Send,
      text: t("landing.simpleSection.sendAndTrack"),
    },
    {
      icon: CreditCard,
      text: t("landing.simpleSection.acceptPayments"),
    },
    {
      icon: BarChart3,
      text: t("landing.simpleSection.monitorStatus"),
    },
  ];

  return (
    <section
      id="features"
      className="py-12 md:py-16 px-4 border-t border-border/60 bg-muted/20"
    >
      <div className="container w-full md:max-w-4xl mx-auto">
        <h2 className="capitalize text-2xl md:text-4xl xl:text-5xl font-semibold text-foreground text-center mb-12 md:mb-16">
          {t("landing.simpleSection.title")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-primary/5 border border-border/50 dark:border-primary/10 hover:border-primary/30 transition-colors"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-muted-foreground text-base md:text-lg pt-1.5">
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export { SimplePowerfulSection };
