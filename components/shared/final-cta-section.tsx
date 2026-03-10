"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FinalCTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden border-t border-border/60 bg-muted/20">
      <div className="container w-full md:max-w-4xl mx-auto px-4 text-center">
        <h2 className="capitalize text-3xl md:text-4xl xl:text-5xl font-bold text-foreground text-balance mb-4">
          {t("landing.finalCta.title")}
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-8">
          {t("landing.finalCta.subtitle")}
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-full px-14 py-4 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link href="/sign-up">
            {t("landing.finalCta.cta")}
            <ArrowRight className="ml-2 h-5 w-5 inline" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export { FinalCTASection };
