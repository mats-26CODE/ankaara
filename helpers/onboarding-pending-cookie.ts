/**
 * Cookie-based storage for onboarding pending data.
 * Used when phone user adds email - the confirmation link opens in a new tab
 * where sessionStorage is empty. Cookie persists across tabs.
 */
const COOKIE_NAME = "onboarding_pending";
const MAX_AGE_SEC = 60 * 60; // 1 hour

export type OnboardingPending = {
  fullName: string;
  businessName: string;
  location: string;
  capacity: string;
  taxNumber?: string;
  currency: string;
};

export const setOnboardingPendingCookie = (data: OnboardingPending) => {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(data));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE_SEC}; samesite=lax`;
};

export const getOnboardingPendingCookie = (): OnboardingPending | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as OnboardingPending;
  } catch {
    return null;
  }
};

export const clearOnboardingPendingCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
};
