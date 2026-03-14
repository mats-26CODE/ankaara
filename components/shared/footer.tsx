"use client";

import { Button } from "@/components/ui/button";
import { TbBrandFacebook, TbBrandInstagram, TbBrandLinkedin } from "react-icons/tb";
import Logo from "./logo";
import { useTranslation } from "@/hooks/use-translation";
import { BsTwitterX } from "react-icons/bs";

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
              <div className="mt-2 flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  aria-label="Twitter"
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <BsTwitterX className="size-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  aria-label="LinkedIn"
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <TbBrandLinkedin className="size-5" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  aria-label="Facebook"
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <TbBrandFacebook className="size-5" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  aria-label="Instagram"
                >
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <TbBrandInstagram className="size-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border mt-12 border-t pt-8 text-center">
          <p className="text-muted-foreground text-sm">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
};
