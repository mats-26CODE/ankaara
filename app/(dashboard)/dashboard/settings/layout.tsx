"use client";

import { useTranslation } from "@/hooks/use-translation";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.common.settings")}</h1>
        <p className="text-muted-foreground text-sm">{t("dashboard.settings.layout.description")}</p>
      </div>
      {children}
    </div>
  );
};

export default SettingsLayout;
