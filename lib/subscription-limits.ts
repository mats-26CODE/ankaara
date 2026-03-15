/**
 * Subscription plan limit enforcement: helpers for app-side handling when
 * the database raises a plan limit error (trigger in 20260317000000).
 * Error message format: "PLAN_LIMIT:<feature_key>" (e.g. PLAN_LIMIT:invoices_per_month).
 */

export const SUBSCRIBE_PATH = "/subscribe";

const PLAN_LIMIT_PREFIX = "PLAN_LIMIT:";

export const isPlanLimitError = (error: unknown): boolean => {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return typeof message === "string" && message.includes(PLAN_LIMIT_PREFIX);
};

export const getPlanLimitFeatureKey = (error: unknown): string | null => {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (typeof message !== "string" || !message.includes(PLAN_LIMIT_PREFIX)) return null;
  const key = message.split(PLAN_LIMIT_PREFIX)[1]?.trim().split(/\s/)[0];
  return key || null;
};
