"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/constants/values";
import { motion } from "motion/react";
import {
  landingFadeUp,
  landingFadeUpTight,
  landingStaggerParent,
  landingViewport,
  ScrollReveal,
} from "@/components/shared/scroll-reveal";

export const AboutUsPage = () => {
  const { t } = useTranslation();

  const values = [
    { titleKey: "about.value1Title", descriptionKey: "about.value1Description" },
    { titleKey: "about.value2Title", descriptionKey: "about.value2Description" },
    { titleKey: "about.value3Title", descriptionKey: "about.value3Description" },
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
          {t("about.title")}
        </motion.h1>
        <motion.div
          variants={landingFadeUp}
          className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl"
        >
          <p className="text-center text-lg font-semibold text-foreground">
            {t("about.subtitle")}
          </p>
        </motion.div>
      </motion.div>

      <div className="mx-auto w-full space-y-6 md:w-3xl">
        <ScrollReveal>
          <Card className="border-border motion-safe:animate-none">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-3 text-xl font-semibold">
                {t("about.missionTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{t("about.missionContent")}</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.06}>
          <Card className="border-border motion-safe:animate-none">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-3 text-xl font-semibold">
                {t("about.visionTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{t("about.visionContent")}</p>
            </CardContent>
          </Card>
        </ScrollReveal>

        <div className="space-y-4">
          <ScrollReveal as="h2" className="text-center text-2xl font-semibold text-foreground">
            {t("about.valuesTitle")}
          </ScrollReveal>
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
            variants={landingStaggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={landingViewport}
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={landingFadeUpTight} className="min-h-0">
                <Card className="border-border motion-safe:animate-none h-full">
                  <CardContent className="p-6">
                    <h3 className="text-foreground mb-2 text-lg font-semibold">
                      {t(value.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(value.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <ScrollReveal delay={0.04}>
          <Card className="border-border motion-safe:animate-none">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-3 text-xl font-semibold">{t("about.teamTitle")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("about.teamDescription")}</p>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal className="border-border bg-muted/50 mx-auto mt-12 w-full rounded-xl border p-6 md:w-3xl">
        <h3 className="text-foreground mb-2 text-xl font-semibold">{t("about.contactTitle")}</h3>
        <p className="text-foreground mb-4">{t("about.contactDescription")}</p>
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

export default AboutUsPage;
