import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles email confirmation links that point to our app (custom email template).
 * Verifies token_hash via verifyOtp, sets session in cookies, redirects.
 * Use when Supabase emailRedirectTo is ignored - link goes here with token_hash.
 */
export const GET = async (request: NextRequest) => {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const redirectTo = requestUrl.searchParams.get("redirect_to");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "email_change" | "email" | "recovery" | "signup" | "invite",
  });

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }

  const next =
    redirectTo && redirectTo.startsWith("/")
      ? redirectTo
      : type === "email_change"
        ? "/onboarding/complete"
        : "/dashboard";

  return NextResponse.redirect(new URL(next, request.url));
};
