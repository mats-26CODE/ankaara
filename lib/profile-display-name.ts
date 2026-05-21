import type { Profile } from "@/hooks/use-profile";
import type { User } from "@supabase/supabase-js";

/** First token of full name (e.g. "Jane Doe" → "Jane"). */
export const profileFirstName = (fullName: string | null | undefined): string | null => {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first.length > 0 ? first : null;
};

/** Name for navbar / avatar: profile DB name, then auth metadata, then contact fallback. */
export const resolveProfileDisplayName = (
  profile: Profile | null | undefined,
  user: User | null | undefined,
): string => {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;

  const fromMeta =
    typeof user?.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  if (fromMeta) return fromMeta;

  return user?.email ?? user?.phone ?? "User";
};

/** First name for compact UI (popover label). Falls back to email/phone if no name set. */
export const resolveProfileFirstName = (
  profile: Profile | null | undefined,
  user: User | null | undefined,
): string => {
  const first =
    profileFirstName(profile?.full_name) ??
    profileFirstName(
      typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : null,
    );
  if (first) return first;
  return user?.email ?? user?.phone ?? "User";
};
