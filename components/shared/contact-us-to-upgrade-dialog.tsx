"use client";

import { Phone } from "lucide-react";

import Logo from "@/components/shared/logo";
import { SocialConnectButtons } from "@/components/shared/social-connect-buttons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUpgradeWhatsAppUrl,
  SUBSCRIBE_SCREEN,
} from "@/constants/subscribe";
import { CONTACT_US_PHONE, CONTACT_US_PHONE_TEL_HREF } from "@/constants/values";

type ContactUsToUpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  intervalLabel?: string;
};

const ContactUsToUpgradeDialog = ({
  open,
  onOpenChange,
  planName,
  intervalLabel,
}: ContactUsToUpgradeDialogProps) => {
  const description = planName
    ? SUBSCRIBE_SCREEN.contactUsToUpgradeDescriptionWithPlan(planName)
    : SUBSCRIBE_SCREEN.contactUsToUpgradeDescription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-5 text-center">
          <Logo size="sm" linked={false} />

          <DialogHeader className="w-full items-center space-y-2 sm:text-center">
            <DialogTitle>{SUBSCRIBE_SCREEN.contactUsToUpgradeTitle}</DialogTitle>
            <DialogDescription className="text-center">{description}</DialogDescription>
          </DialogHeader>

          <Button variant="outline" size="lg" className="rounded-full px-6" asChild>
            <a href={CONTACT_US_PHONE_TEL_HREF}>
              <Phone className="size-4" />
              {CONTACT_US_PHONE}
            </a>
          </Button>

          <SocialConnectButtons
            className="justify-center"
            whatsappUrl={getUpgradeWhatsAppUrl(planName, intervalLabel)}
          />

          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {SUBSCRIBE_SCREEN.contactUsToUpgradeDismiss}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ContactUsToUpgradeDialog };
