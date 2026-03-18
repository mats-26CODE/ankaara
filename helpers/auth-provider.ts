import type { User } from "@supabase/supabase-js";

/**
 * User signed up via Google OAuth (has email from Google, typically no phone).
 */
export const isGoogleUser = (user: User | null): boolean => {
  if (!user) return false;
  const provider = user.app_metadata?.provider as string | undefined;
  const identities = user.identities ?? [];
  return provider === "google" || identities.some((i) => i.provider === "google");
};

/**
 * User signed up via phone/SMS (has phone, may not have email).
 */
export const isPhoneUser = (user: User | null): boolean => {
  if (!user) return false;
  return !!user.phone?.trim();
};
