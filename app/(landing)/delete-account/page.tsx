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

export const DeleteAccountPage = () => {
  const { t } = useTranslation();

  const steps = [
    "deleteAccount.step1",
    "deleteAccount.step2",
    "deleteAccount.step3",
    "deleteAccount.step4",
    "deleteAccount.step5",
  ];

  const sections = [
    { titleKey: "deleteAccount.deletedTitle", contentKey: "deleteAccount.deletedContent" },
    { titleKey: "deleteAccount.retentionTitle", contentKey: "deleteAccount.retentionContent" },
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
          {t("deleteAccount.title")}
        </motion.h1>
        <motion.div
          variants={landingFadeUp}
          className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl"
        >
          <p className="text-muted-foreground text-center text-xs">
            {t("deleteAccount.lastUpdated")}
          </p>
          <p className="text-center text-sm text-foreground">{t("deleteAccount.introduction")}</p>
        </motion.div>
      </motion.div>

      <div className="mx-auto w-full space-y-6 md:w-3xl">
        <ScrollReveal>
          <Card className="border-border motion-safe:animate-none">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-4 text-xl font-semibold">
                {t("deleteAccount.inAppTitle")}
              </h2>
              <ol className="text-muted-foreground list-decimal space-y-2 pl-5 leading-relaxed">
                {steps.map((stepKey) => (
                  <li key={stepKey}>{t(stepKey)}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </ScrollReveal>

        {sections.map((section, index) => (
          <ScrollReveal key={section.titleKey} delay={(index + 1) * 0.05}>
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

        <ScrollReveal delay={0.15}>
          <Card className="border-border motion-safe:animate-none">
            <CardContent className="p-6">
              <h2 className="text-foreground mb-3 text-xl font-semibold">
                {t("deleteAccount.supportTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("deleteAccount.supportContent")}
              </p>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal className="border-border bg-muted/50 mx-auto mt-12 w-full rounded-xl border p-6 md:w-3xl">
        <h3 className="text-foreground mb-2 text-xl font-semibold">
          {t("deleteAccount.contactTitle")}
        </h3>
        <p className="text-foreground mb-4">{t("deleteAccount.contactDescription")}</p>
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

export default DeleteAccountPage;
