import { NextRequest, NextResponse } from "next/server";

const isAllowedUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname.includes("googleusercontent") ||
      parsed.hostname.includes("supabase") ||
      parsed.hostname.includes("cloudinary") ||
      /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/i.test(url)
    );
  } catch {
    return false;
  }
};

export const GET = async (request: NextRequest) => {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Ankara-Invoice-Export/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
};
