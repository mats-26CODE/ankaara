import { NextRequest, NextResponse } from "next/server";
import { createAnonClient, createClient } from "@/lib/supabase/server";

const SLUG_RE = /^[a-z0-9]{10}$/;

export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) => {
  const { slug: raw } = await context.params;
  const slug = raw.trim().toLowerCase();

  if (!SLUG_RE.test(slug)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const anon = createAnonClient();
  const { data: saleId, error } = await anon.rpc("resolve_sale_short_link", {
    p_slug: slug,
  });

  if (error || !saleId || typeof saleId !== "string") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const targetPath = `/dashboard/sales/${saleId}`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", targetPath);
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(targetPath, request.url));
};
