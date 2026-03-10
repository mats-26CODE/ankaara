import React, { ReactNode, useEffect } from "react";
import { useTheme as useThemeStore } from "@/lib/stores/preferences-store";

export { useTheme } from "@/lib/stores/preferences-store";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return <>{children}</>;
};
