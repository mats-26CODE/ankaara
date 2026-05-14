"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

type AppLanguage = "en" | "sw";

/**
 * After profile loads, align Zustand language with `profiles.preferred_language`
 * (source of truth when signed in).
 */
export const ProfileLanguageSync = () => {
  const { user } = useUser();
  const { profile, loading } = useProfile();
  const setLanguage = usePreferencesStore((s) => s.setLanguage);

  useEffect(() => {
    if (!user || loading || !profile) return;
    const lang: AppLanguage = profile.preferred_language === "en" ? "en" : "sw";
    setLanguage(lang);
  }, [user?.id, loading, profile?.preferred_language, setLanguage]);

  return null;
};
