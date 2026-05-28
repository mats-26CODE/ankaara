"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import {
  landingFadeUp,
  landingStaggerParent,
  landingViewport,
} from "@/components/shared/scroll-reveal";

const FinalCTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-muted/20 py-16 md:py-24">
      <div
        aria-hidden
        className="from-primary/8 via-transparent to-accent/10 pointer-events-none absolute inset-0 bg-linear-to-t"
      />
      <motion.div
        className="container relative mx-auto w-full px-4 text-center md:max-w-4xl"
        variants={landingStaggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
      >
        <motion.h2
          variants={landingFadeUp}
          className="text-foreground mb-4 text-balance text-3xl font-bold capitalize md:text-4xl xl:text-5xl"
        >
          {t("landing.finalCta.title")}
        </motion.h2>
        <motion.p
          variants={landingFadeUp}
          className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg md:text-xl"
        >
          {t("landing.finalCta.subtitle")}
        </motion.p>
        <motion.div variants={landingFadeUp} className="inline-block">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-primary px-14 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/sign-up">
              {t("landing.finalCta.cta")}
              <ArrowRight className="ml-2 inline h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export { FinalCTASection };
