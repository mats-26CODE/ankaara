"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TbBrandFacebook, TbBrandInstagram, TbBrandLinkedin } from "react-icons/tb";
import { BsTwitterX } from "react-icons/bs";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL, CONTACT_US_PHONE } from "@/constants/values";

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

const faqKeys: FAQItem[] = [
  { questionKey: "support.faq1Question", answerKey: "support.faq1Answer" },
  { questionKey: "support.faq2Question", answerKey: "support.faq2Answer" },
  { questionKey: "support.faq3Question", answerKey: "support.faq3Answer" },
  { questionKey: "support.faq4Question", answerKey: "support.faq4Answer" },
  { questionKey: "support.faq5Question", answerKey: "support.faq5Answer" },
  { questionKey: "support.faq6Question", answerKey: "support.faq6Answer" },
];

export const SupportPage = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:max-w-6xl md:py-12">
      <div className="mb-8">
        <h1 className="text-primary mb-4 text-center text-3xl font-bold md:text-4xl">
          {t("support.title")}
        </h1>
        <div className="mx-auto flex w-full flex-col items-center gap-3 md:w-3xl">
          <p className="text-foreground text-center text-sm">{t("support.description")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-foreground mb-6 text-center text-2xl font-semibold">
          {t("support.faqTitle")}
        </h2>
        <div className="mx-auto w-full md:w-3xl">
          {faqKeys.map((faq, index) => (
            <Card
              key={index}
              className={cn(
                "border-border hover:border-primary/50 cursor-pointer overflow-hidden rounded-none p-1 transition-colors",
                openIndex === index && "border-primary/50",
                index === 0 && "rounded-t-2xl",
                index === faqKeys.length - 1 && "rounded-b-2xl",
              )}
              onClick={() => toggleFAQ(index)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <h3 className="text-foreground pr-8 text-lg font-semibold">
                    {t(faq.questionKey)}
                  </h3>
                  <motion.div
                    animate={{
                      rotate: openIndex === index ? 180 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="text-muted-foreground h-5 w-5" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pt-0 pb-6">
                        <p className="text-muted-foreground leading-relaxed">{t(faq.answerKey)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-border bg-muted/50 mx-auto mt-12 w-full rounded-xl border p-6 md:w-3xl">
        <h3 className="text-foreground mb-2 text-xl font-semibold">{t("support.stillNeedHelp")}</h3>
        <p className="text-foreground mb-4">{t("support.stillNeedHelpDescription")}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-full px-6 py-2 transition-colors"
        >
          {t("support.contactSupport")}
        </a>

        <h4 className="text-foreground mt-8 mb-3 text-lg font-semibold">
          {t("support.contactsTitle")}
        </h4>
        <div className="text-foreground flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t("support.emailLabel")}: </span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">{t("support.phoneLabel")}: </span>
            <a
              href={`tel:${CONTACT_US_PHONE.replace(/\s/g, "")}`}
              className="text-primary hover:underline"
            >
              {CONTACT_US_PHONE}
            </a>
          </p>
        </div>

        <div className="mt-6">
          <p className="text-foreground mb-2 text-sm font-medium">{t("footer.connect")}</p>
          <div className="flex gap-2">
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
  );
};

export default SupportPage;
