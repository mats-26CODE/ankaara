"use client";

import { Button } from "@/components/ui/button";
import { TbBrandFacebook, TbBrandInstagram } from "react-icons/tb";
import { FaWhatsapp } from "react-icons/fa";
import {
  CONTACT_US_WHATSAPP_URL,
  CONTACT_US_FACEBOOK_URL,
  CONTACT_US_INSTAGRAM_URL,
} from "@/constants/values";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

type SocialConnectButtonsProps = {
  className?: string;
  /** Override WhatsApp link (e.g. pre-filled upgrade message). */
  whatsappUrl?: string;
};

const SocialConnectButtons = ({ className, whatsappUrl }: SocialConnectButtonsProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex gap-2", className)}>
      <Button size="icon" variant="outline" className="rounded-full" asChild>
        <a
          href={whatsappUrl ?? CONTACT_US_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("footer.socialWhatsApp")}
        >
          <FaWhatsapp className="size-5" />
        </a>
      </Button>
      <Button size="icon" variant="outline" className="rounded-full" asChild>
        <a
          href={CONTACT_US_FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("footer.socialFacebook")}
        >
          <TbBrandFacebook className="size-5" />
        </a>
      </Button>
      <Button size="icon" variant="outline" className="rounded-full" asChild>
        <a
          href={CONTACT_US_INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("footer.socialInstagram")}
        >
          <TbBrandInstagram className="size-5" />
        </a>
      </Button>
    </div>
  );
};

export { SocialConnectButtons };
