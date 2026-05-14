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

export const PrivacyPage = () => {
  const { t } = useTranslation();

  const sections = [
    { titleKey: "privacy.section1Title", contentKey: "privacy.section1Content" },
    { titleKey: "privacy.section2Title", contentKey: "privacy.section2Content" },
    { titleKey: "privacy.section3Title", contentKey: "privacy.section3Content" },
    { titleKey: "privacy.section4Title", contentKey: "privacy.section4Content" },
    { titleKey: "privacy.section5Title", contentKey: "privacy.section5Content" },
    { titleKey: "privacy.section6Title", contentKey: "privacy.section6Content" },
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
          {t("privacy.title")}
        </motion.h1>
        <motion.div
          variants={landingFadeUp}
          className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl"
        >
          <p className="text-muted-foreground text-center text-xs">{t("privacy.lastUpdated")}</p>
          <p className="text-center text-sm text-foreground">{t("privacy.introduction")}</p>
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
        <h3 className="text-foreground mb-2 text-xl font-semibold">{t("privacy.contactTitle")}</h3>
        <p className="text-foreground mb-4">{t("privacy.contactDescription")}</p>
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

export default PrivacyPage;
