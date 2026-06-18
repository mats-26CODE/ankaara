/**
 * Subscription plan limit enforcement: helpers for app-side handling when
 * the database raises a plan limit error (trigger in 20260317000000).
 * Error message format: "PLAN_LIMIT:<feature_key>" (e.g. PLAN_LIMIT:invoices_per_month).
 * Errors may be Error instances or Postgres-style objects { code, message, details }.
 */

import {
  getPlanTier,
  type PlanTier,
  type SubscriptionPlanSlug,
} from "@/hooks/use-subscription-plans";

export const SUBSCRIBE_PATH = "/subscribe";

const PLAN_TIER_RANK: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  business: 2,
};

export const getPlanTierRank = (
  slug: SubscriptionPlanSlug | string | null | undefined,
): number => PLAN_TIER_RANK[getPlanTier(slug)];

export const isSamePlanTier = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => getPlanTier(currentSlug) === getPlanTier(targetSlug);

/** Exact plan slug match (tier + billing interval). */
export const isExactSamePlan = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => {
  if (!targetSlug) return false;
  if (!currentSlug || currentSlug === "free") return targetSlug === "free";
  return currentSlug === targetSlug;
};

/** Same paid tier, different billing interval (e.g. pro-monthly → pro-yearly). */
export const isBillingIntervalChange = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => {
  if (!currentSlug || !targetSlug || currentSlug === "free" || targetSlug === "free") {
    return false;
  }
  if (currentSlug === targetSlug) return false;
  return isSamePlanTier(currentSlug, targetSlug);
};

export const canUpgradeToPlan = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => getPlanTierRank(targetSlug) > getPlanTierRank(currentSlug);

export const isPlanDowngrade = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => getPlanTierRank(targetSlug) < getPlanTierRank(currentSlug);

/** Paid checkout: higher tier or same-tier billing interval change. */
export const canCheckoutPlan = (
  currentSlug: SubscriptionPlanSlug | string | null | undefined,
  targetSlug: SubscriptionPlanSlug | string | null | undefined,
): boolean => {
  if (!targetSlug || isExactSamePlan(currentSlug, targetSlug)) return false;
  if (isPlanDowngrade(currentSlug, targetSlug)) return false;
  return (
    canUpgradeToPlan(currentSlug, targetSlug) ||
    isBillingIntervalChange(currentSlug, targetSlug)
  );
};

const PLAN_LIMIT_PREFIX = "PLAN_LIMIT:";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error != null && typeof error === "object" && "message" in error)
    return String((error as { message: unknown }).message ?? "");
  return "";
};

export const isPlanLimitError = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return typeof message === "string" && message.includes(PLAN_LIMIT_PREFIX);
};

export const getPlanLimitFeatureKey = (error: unknown): string | null => {
  const message = getErrorMessage(error);
  if (typeof message !== "string" || !message.includes(PLAN_LIMIT_PREFIX)) return null;
  const key = message.split(PLAN_LIMIT_PREFIX)[1]?.trim().split(/\s/)[0];
  return key || null;
};

/**
 * URL to redirect to when user hits a plan limit. Includes limit key so the
 * subscribe page can preselect the next plan (free→pro, pro→business).
 */
export const getSubscribeUrlForPlanLimit = (error: unknown): string => {
  const key = getPlanLimitFeatureKey(error);
  if (key) return `${SUBSCRIBE_PATH}?limit=${encodeURIComponent(key)}`;
  return SUBSCRIBE_PATH;
};

/** Plan tiers for upgrade suggestion. */
export const PLAN_TIER_ORDER = ["free", "pro", "business"] as const;

/**
 * Returns the next plan slug to suggest when the user hits a limit on current plan.
 * free → pro-monthly, any pro → business, business → business (already max).
 */
export const getNextPlanSlug = (
  currentSlug: string,
): "free" | "pro-monthly" | "pro-6month" | "pro-yearly" | "business" => {
  const isPro =
    currentSlug === "pro" ||
    currentSlug === "pro-monthly" ||
    currentSlug === "pro-6month" ||
    currentSlug === "pro-yearly";
  if (currentSlug === "business" || isPro) return "business";
  return "pro-monthly";
};

const PLAN_LIMIT_REACHED_MESSAGES: Record<string, string> = {
  sales_per_month:
    "You've reached your limit of 10 sales per month on the Free plan. Upgrade to Pro for unlimited sales.",
  invoices_per_month:
    "You've reached your monthly invoice limit. Upgrade to create more invoices.",
  clients_per_business:
    "You've reached your client limit for this business. Upgrade to add more clients.",
  products_per_business:
    "You've reached your product or service limit for this business. Upgrade to add more.",
  businesses_count: "You've reached your business limit. Upgrade to add more businesses.",
  quotations_count:
    "You've reached your monthly quotation limit. Upgrade to create more quotations.",
  product_sales_reports:
    "Product sales reports are available on Pro and Business plans. Upgrade to unlock reports.",
};

/** User-facing copy when redirected to subscribe after hitting a plan limit. */
export const getPlanLimitReachedMessage = (featureKey: string | null): string => {
  if (featureKey && PLAN_LIMIT_REACHED_MESSAGES[featureKey]) {
    return PLAN_LIMIT_REACHED_MESSAGES[featureKey];
  }
  return "You've reached your plan limit. Upgrade to a higher plan to continue.";
};
