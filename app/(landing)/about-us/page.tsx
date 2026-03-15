"use client";

import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/constants/values";

export const AboutUsPage = () => {
  const { t } = useTranslation();

  const values = [
    { titleKey: "about.value1Title", descriptionKey: "about.value1Description" },
    { titleKey: "about.value2Title", descriptionKey: "about.value2Description" },
    { titleKey: "about.value3Title", descriptionKey: "about.value3Description" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:max-w-6xl md:py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-center text-3xl font-bold text-primary md:text-4xl">
          {t("about.title")}
        </h1>
        <div className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl">
          <p className="text-center text-lg font-semibold text-foreground">
            {t("about.subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full space-y-6 md:w-3xl">
        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-foreground">
              {t("about.missionTitle")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t("about.missionContent")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-foreground">
              {t("about.visionTitle")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t("about.visionContent")}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            {t("about.valuesTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {values.map((value, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t(value.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(value.descriptionKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-foreground">
              {t("about.teamTitle")}
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {t("about.teamDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-12 w-full rounded-xl border border-border bg-muted/50 p-6 md:w-3xl">
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          {t("about.contactTitle")}
        </h3>
        <p className="mb-4 text-foreground">{t("about.contactDescription")}</p>
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

export default AboutUsPage;
