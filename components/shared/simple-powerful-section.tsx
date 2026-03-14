"use client";

import { useTranslation } from "@/hooks/use-translation";
import { FileText, Send, CreditCard, BarChart3 } from "lucide-react";

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
    <section id="features" className="border-border/60 bg-muted/20 border-t px-4 py-12 md:py-16">
      <div className="container mx-auto w-full md:max-w-4xl">
        <h2 className="text-foreground font-brand mb-12 text-center text-2xl font-semibold capitalize md:mb-16 md:text-4xl xl:text-5xl">
          {t("landing.simpleSection.title")}
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-8">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={index}
                className="dark:bg-primary/5 border-border/50 dark:border-primary/10 hover:border-primary/30 flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors"
              >
                <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-muted-foreground pt-1.5 text-base md:text-lg">
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
