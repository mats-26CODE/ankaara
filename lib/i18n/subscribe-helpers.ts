import { usePreferencesStore } from "@/lib/stores/preferences-store";

const formatSubscriptionEndDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getSubscribeIntervalLabel = (interval: string | null): string => {
  const t = usePreferencesStore.getState().t;
  if (interval === "monthly") return t("dashboard.subscription.intervals.monthly");
  if (interval === "6_month") return t("dashboard.subscription.intervals.sixMonth");
  if (interval === "yearly") return t("dashboard.subscription.intervals.yearly");
  return "";
};

export const getSubscribePeriodSuffix = (interval: string | null): string => {
  const t = usePreferencesStore.getState().t;
  if (interval === "monthly") return t("dashboard.subscription.periods.monthly");
  if (interval === "6_month") return t("dashboard.subscription.periods.sixMonth");
  if (interval === "yearly") return t("dashboard.subscription.periods.yearly");
  return "";
};

export const getBillingIntervalChangeNote = (endDate: string | null): string => {
  const t = usePreferencesStore.getState().t;
  if (endDate) {
    return t("dashboard.subscription.billingChange.withDate", {
      endDate: formatSubscriptionEndDate(endDate),
    });
  }
  return t("dashboard.subscription.billingChange.default");
};

export const getUpgradeWhatsAppUrl = (
  baseUrl: string,
  planName?: string,
  intervalLabel?: string,
) => {
  if (!planName) return baseUrl;

  const t = usePreferencesStore.getState().t;
  const intervalSuffix = intervalLabel ? ` (${intervalLabel})` : "";
  const message = t("dashboard.subscription.whatsappUpgrade", {
    planName,
    intervalSuffix,
  });
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
};

export const getPlanLimitReachedMessage = (featureKey: string | null): string => {
  const t = usePreferencesStore.getState().t;
  if (featureKey) {
    const key = `dashboard.subscription.limits.${featureKey}`;
    const message = t(key);
    if (message !== key) return message;
  }
  return t("dashboard.subscription.limits.default");
};
