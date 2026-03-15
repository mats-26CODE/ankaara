/**
 * Subscription plan limit enforcement: helpers for app-side handling when
 * the database raises a plan limit error (trigger in 20260317000000).
 * Error message format: "PLAN_LIMIT:<feature_key>" (e.g. PLAN_LIMIT:invoices_per_month).
 * Errors may be Error instances or Postgres-style objects { code, message, details }.
 */

export const SUBSCRIBE_PATH = "/subscribe";

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
