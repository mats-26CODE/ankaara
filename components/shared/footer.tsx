"use client";

import Logo from "./logo";
import { useTranslation } from "@/hooks/use-translation";
import { SocialConnectButtons } from "@/components/shared/social-connect-buttons";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-muted/30 border-border w-full border-t">
      <div className="container mx-auto px-4 py-8 md:px-20 md:py-12">
        <div className="space-y-4 md:grid md:grid-cols-4 md:space-y-0">
          {/* Brand */}
          <div className="flex flex-col space-y-4">
            <Logo size="xs" />
            <p className="text-muted-foreground line-clamp-3 w-2/3 text-sm">
              {t("footer.description")}
            </p>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold">{t("footer.company")}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/about-us"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t("footer.aboutUs")}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold">{t("footer.resources")}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/support"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t("footer.helpCenter")}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t("footer.termsOfService")}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t("footer.privacyPolicy")}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Connect */}
          <div className="space-y-4">
            <h3 className="text-foreground font-semibold">{t("footer.connect")}</h3>

            <div className="space-y-2">
              <SocialConnectButtons className="mt-2" />
            </div>
          </div>
        </div>

        <div className="border-border mt-12 flex items-center justify-center gap-5 border-t pt-8 text-center">
          <p className="text-muted-foreground text-sm">{t("footer.copyright")}</p>
          <p className="text-muted-foreground text-sm">🚀 Tayos Labs</p>
        </div>
      </div>
    </footer>
  );
};
