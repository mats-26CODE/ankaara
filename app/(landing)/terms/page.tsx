"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/constants/values";

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
      <div className="mb-8">
        <h1 className="mb-4 text-center text-3xl font-bold text-primary md:text-4xl">
          {t("terms.title")}
        </h1>
        <div className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl">
          <p className="text-center text-xs text-muted-foreground">
            {t("terms.lastUpdated")}
          </p>
          <p className="text-center text-sm text-foreground">
            {t("terms.introduction")}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full space-y-6 md:w-3xl">
        {sections.map((section, index) => (
          <Card key={index} className="border-border">
            <CardContent className="p-6">
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                {t(section.titleKey)}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {t(section.contentKey)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-12 w-full rounded-xl border border-border bg-muted/50 p-6 md:w-3xl">
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          {t("terms.contactTitle")}
        </h3>
        <p className="mb-4 text-foreground">{t("terms.contactDescription")}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-block rounded-full bg-primary px-6 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("support.contactSupport")}
        </a>
      </div>
    </div>
  );
};

export default TermsPage;
