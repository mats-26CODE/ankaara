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
} as const;

export const getBillingIntervalChangeNote = (endDate: string | null): string => {
  if (endDate) {
    return `Your new billing period starts when your current plan ends on ${formatSubscriptionEndDate(endDate)}.`;
  }
  return "Your new billing period starts when your current plan ends.";
};
