import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side OAuth code exchange. PKCE code verifier is stored in cookies
 * by @supabase/ssr when the OAuth flow starts - only the server can read it.
 */
export const GET = async (request: NextRequest) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
};
