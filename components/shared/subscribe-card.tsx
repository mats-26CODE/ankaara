"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { AtSign } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { SUPPORT_EMAIL } from "@/constants/values";

interface SubscribeCardProps {
  showHeader?: boolean;
  titleKey?: string;
  descriptionKey?: string;
  className?: string;
}

export const SubscribeCard = ({
  showHeader = false,
  titleKey = "landing.subscribeTitle",
  descriptionKey = "landing.subscribeDescription",
  className = "",
}: SubscribeCardProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (email.trim()) {
      // We'll implement subscription logic here in the future
      // For now, we'll use mailto as a fallback
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Subscribe to Newsletter&body=Email: ${email}`;
      setEmail("");
    }
  };

  const hasCustomStyling =
    className.includes("bg-") || className.includes("p-0");
  const wrapperClasses = hasCustomStyling
    ? className
    : `w-full md:w-3xl mx-auto p-6 bg-muted/50 rounded-xl border border-border ${className}`;

  const inputGroupClasses = hasCustomStyling
    ? "bg-muted/50 border border-primary/20 text-foreground placeholder:text-muted-foreground h-10 flex-1"
    : "bg-background border border-primary/20 text-foreground placeholder:text-muted-foreground h-10 flex-1";

  return (
    <div className={wrapperClasses}>
      {showHeader && (
        <>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t(titleKey)}
          </h3>
          <p className="text-foreground mb-4">{t(descriptionKey)}</p>
        </>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <InputGroup className={inputGroupClasses}>
          <InputGroupInput
            type="email"
            placeholder={t("landing.emailPlaceholder") || "Enter your email"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubscribe();
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <AtSign className="text-muted-foreground text-2xl" />
          </InputGroupAddon>
        </InputGroup>
        <Button
          onClick={handleSubscribe}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full whitespace-nowrap"
        >
          {t("landing.subscribeButton") || "Subscribe"}
        </Button>
      </div>
    </div>
  );
};

