"use client";

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ToastAlert } from "@/config/toast";
import { ThemeProvider } from "@/contexts/theme-context";
import { getQueryClient } from "@/config/query-client";
import { ProfileLanguageSync } from "@/components/shared/profile-language-sync";

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the query client instance
  // This will create a new instance on the server and reuse it on the client
  const queryClient = getQueryClient();

  // Ensure the query client is available
  if (!queryClient) {
    ToastAlert.error("Failed to setup client query provider connection");
    return null;
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ProfileLanguageSync />
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default Providers;
