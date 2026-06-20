import { CONTACT_US_WHATSAPP_URL } from "@/constants/values";

const formatSubscriptionEndDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const SUBSCRIBE_SCREEN = {
  freePlanNote: "You're on the Free plan. Upgrade above when you need more.",
  currentPlanNote: "You're currently on this plan.",
  downgradePlanNote: "Contact support if you need to switch to a lower plan.",
  contactUsToUpgradeTitle: "Contact us to upgrade",
  contactUsToUpgradeDescription:
    "Online payments are coming soon. Reach out and we'll help you get started on your chosen plan.",
  contactUsToUpgradeDescriptionWithPlan: (planName: string) =>
    `Online payments are coming soon. Reach out and we'll help you upgrade to ${planName}.`,
  contactUsToUpgradeDismiss: "Close",
} as const;

export const getUpgradeWhatsAppUrl = (planName?: string, intervalLabel?: string) => {
  if (!planName) return CONTACT_US_WHATSAPP_URL;

  const intervalSuffix = intervalLabel ? ` (${intervalLabel})` : "";
  const message = encodeURIComponent(
    `Hi, I'd like to upgrade to ${planName}${intervalSuffix} on Ankaara.`,
  );
  return `${CONTACT_US_WHATSAPP_URL}?text=${message}`;
};

export const getBillingIntervalChangeNote = (endDate: string | null): string => {
  if (endDate) {
    return `Your new billing period starts when your current plan ends on ${formatSubscriptionEndDate(endDate)}.`;
  }
  return "Your new billing period starts when your current plan ends.";
};
