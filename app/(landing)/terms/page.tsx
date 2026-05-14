"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/constants/values";
import { motion } from "motion/react";
import {
  landingFadeUp,
  landingStaggerParent,
  landingViewport,
  ScrollReveal,
} from "@/components/shared/scroll-reveal";

export const TermsPage = () => {
  const { t } = useTranslation();

  const sections = [
    { titleKey: "terms.section1Title", contentKey: "terms.section1Content" },
    { titleKey: "terms.section2Title", contentKey: "terms.section2Content" },
    { titleKey: "terms.section3Title", contentKey: "terms.section3Content" },
    { titleKey: "terms.section4Title", contentKey: "terms.section4Content" },
    { titleKey: "terms.section5Title", contentKey: "terms.section5Content" },
    { titleKey: "terms.section6Title", contentKey: "terms.section6Content" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:max-w-6xl md:py-12">
      <motion.div
        className="mb-8"
        variants={landingStaggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={landingViewport}
      >
        <motion.h1
          variants={landingFadeUp}
          className="text-primary mb-4 text-center text-3xl font-bold md:text-4xl"
        >
          {t("terms.title")}
        </motion.h1>
        <motion.div
          variants={landingFadeUp}
          className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl"
        >
          <p className="text-muted-foreground text-center text-xs">{t("terms.lastUpdated")}</p>
          <p className="text-center text-sm text-foreground">{t("terms.introduction")}</p>
        </motion.div>
      </motion.div>

      <div className="mx-auto w-full space-y-6 md:w-3xl">
        {sections.map((section, index) => (
          <ScrollReveal key={section.titleKey} delay={index * 0.05}>
            <Card className="border-border motion-safe:animate-none">
              <CardContent className="p-6">
                <h2 className="text-foreground mb-3 text-xl font-semibold">
                  {t(section.titleKey)}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t(section.contentKey)}</p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="border-border bg-muted/50 mx-auto mt-12 w-full rounded-xl border p-6 md:w-3xl">
        <h3 className="text-foreground mb-2 text-xl font-semibold">{t("terms.contactTitle")}</h3>
        <p className="text-foreground mb-4">{t("terms.contactDescription")}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-full px-6 py-2 transition-colors"
        >
          {t("support.contactSupport")}
        </a>
      </ScrollReveal>
    </div>
  );
};

export default TermsPage;
