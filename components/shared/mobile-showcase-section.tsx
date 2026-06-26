"use client";

import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";
import { motion } from "motion/react";
import {
  landingFadeUp,
  landingFadeUpTight,
  landingStaggerParent,
  landingViewport,
} from "@/components/shared/scroll-reveal";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import { StoreButtons } from "@/components/shared/store-buttons";

const MobileShowcaseSection = () => {
  const { t } = useTranslation();
  const { instant, motionInitial, viewport } = useLandingMotion({ belowHero: true });

  return (
    <section
      id="mobile-app"
      className="border-border/60 relative overflow-hidden border-t px-4 py-12 md:py-16"
    >
      <div
        aria-hidden
        className="from-primary/10 via-transparent to-accent/10 pointer-events-none absolute inset-0 -z-10 bg-linear-to-br"
      />
      <div className="container mx-auto flex w-full flex-col items-center text-center md:max-w-3xl">
        <motion.div
          className="flex flex-col items-center"
          variants={landingStaggerParent}
          initial={motionInitial}
          whileInView="visible"
          viewport={landingViewport}
        >
          <motion.span
            variants={landingFadeUpTight}
            className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
          >
            {t("landing.mobileShowcase.badge")}
          </motion.span>
          <motion.h2
            variants={landingFadeUp}
            className="text-foreground text-2xl font-semibold text-balance capitalize md:text-3xl xl:text-4xl"
          >
            {t("landing.mobileShowcase.title")}
          </motion.h2>
          <motion.p
            variants={landingFadeUp}
            className="text-muted-foreground mt-4 max-w-xl text-base text-pretty md:text-lg"
          >
            {t("landing.mobileShowcase.subtitle")}
          </motion.p>

          <motion.div variants={landingFadeUp} className="mt-8">
            <StoreButtons className="justify-center" />
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mt-12 w-full max-w-md md:mt-14 md:max-w-xl"
          initial={instant ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: instant ? 0 : 0.5 }}
        >
          <div
            aria-hidden
            className="from-primary/20 to-accent/20 absolute inset-x-6 top-10 bottom-0 -z-10 rounded-[3rem] bg-linear-to-b blur-2xl"
          />
          <Image
            src="/ankaara_app_screenshots.png"
            alt={t("landing.mobileShowcase.imageAlt")}
            width={859}
            height={1024}
            className="mx-auto h-auto w-full drop-shadow-2xl"
            priority={false}
          />
        </motion.div>
      </div>
    </section>
  );
};

export { MobileShowcaseSection };
