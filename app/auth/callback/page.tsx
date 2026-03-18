"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import Logo from "@/components/shared/logo";

/**
 * Auth callback handles both:
 * 1. OAuth (Google): redirects with ?code=xxx - we exchange for session
 * 2. Email change / magic link: redirects with #access_token=xxx&refresh_token=xxx
 *    (hash is NOT sent to server - only client can read it)
 */
const AuthCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const code = searchParams.get("code");

    const handleAuth = async () => {
      const supabase = createClient();

      // 1. OAuth flow: code in query params - must run on SERVER (PKCE code verifier is in cookies)
      if (code) {
        window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        return;
      }

      // 2. Email change / magic link: tokens in hash fragment (only client can read)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1), // remove #
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!sessionError) {
            // Clear hash from URL before redirect
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
            router.replace(next);
            return;
          }
          setError(sessionError.message);
          return;
        }
      }

      setError("Invalid or expired link");
    };

    handleAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
        <Logo size="sm" />
        <p className="text-destructive mt-4 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="text-primary mt-4 text-sm hover:underline"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
      <Logo size="sm" />
      <p className="text-muted-foreground mt-4 text-sm">Completing sign in...</p>
      <Spinner className="mt-4 size-6" />
    </div>
  );
};

const AuthCallbackPageWithSuspense = () => (
  <Suspense
    fallback={
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
        <Logo size="sm" />
        <Spinner className="mt-4 size-6" />
      </div>
    }
  >
    <AuthCallbackPage />
  </Suspense>
);

export default AuthCallbackPageWithSuspense;
