"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles auth tokens in URL hash when Supabase redirects to Site URL instead of our callback.
 * emailRedirectTo is often ignored for updateUser email change - Supabase redirects to Site URL
 * (e.g. http://localhost:3000/) with session in hash. This runs on every page load and catches it.
 */
export const AuthHashHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || typeof window === "undefined") return;
    if (!window.location.hash) return;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type"); // e.g. "recovery", "email_change"
    const next = hashParams.get("next");

    if (!accessToken || !refreshToken) return;

    handledRef.current = true;

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          handledRef.current = false;
          return;
        }
        // Clear hash before redirect
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        const redirectTo =
          next || (type === "email_change" ? "/onboarding/complete" : "/dashboard");
        router.replace(redirectTo);
      })
      .catch(() => {
        handledRef.current = false;
      });
  }, [router, pathname]);

  return null;
};
