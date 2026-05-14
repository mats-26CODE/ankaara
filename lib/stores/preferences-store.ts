"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import { translations, defaultLanguage, t as translate } from "@/lib/i18n/translations";

type Theme = "light" | "dark";
type Language = "en" | "sw";

const defaultTranslator = (key: string, vars?: Record<string, string | number>) =>
  translate(defaultLanguage, key, vars);

interface PreferencesState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

// Create the store with persistence
const createPreferencesStore = () => {
  return create<PreferencesState>()(
    persist(
      (set, get) => ({
        theme: "light",
        language: defaultLanguage as Language, // aligns with profiles.preferred_language default
        setTheme: (theme: Theme) => {
          set({ theme });
          if (typeof window !== "undefined") {
            document.documentElement.classList.toggle("dark", theme === "dark");
          }
        },
        setLanguage: (lang: Language) => {
          set({ language: lang });
          if (typeof window !== "undefined") {
            document.documentElement.lang = lang;
          }
        },
        t: (key: string, vars?: Record<string, string | number>) => {
          const { language } = get();
          return translate(language, key, vars);
        },
      }),
      {
        name: "preferences-store", // unique name for localStorage key
        storage: createJSONStorage(() => localStorage),
        // Initialize theme and language on load
        onRehydrateStorage: () => (state) => {
          if (state && typeof window !== "undefined") {
            const isDark = state.theme === "dark";
            document.documentElement.classList.toggle("dark", isDark);
            document.documentElement.lang = state.language;
          }
        },
      },
    ),
  );
};

export const usePreferencesStore = createPreferencesStore();

// Hooks for easier access
export const useTheme = () => {
  const theme = useSyncExternalStore(
    usePreferencesStore.subscribe,
    () => usePreferencesStore.getState().theme,
    () => "light", // SSR value
  );
  const setTheme = usePreferencesStore((state) => state.setTheme);

  return {
    theme,
    setTheme,
    toggleTheme: () => {
      const current = usePreferencesStore.getState().theme;
      setTheme(current === "light" ? "dark" : "light");
    },
  };
};

export const useLanguage = () => {
  const language = useSyncExternalStore(
    usePreferencesStore.subscribe,
    () => usePreferencesStore.getState().language,
    () => defaultLanguage, // SSR value
  );
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const t = useSyncExternalStore(
    usePreferencesStore.subscribe,
    () => usePreferencesStore.getState().t,
    () => defaultTranslator, // SSR value
  );

  return {
    language,
    setLanguage,
    t,
    translations, // Export translations for language switcher
  };
};

// Re-export translations for components that need them
export { translations };
