"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { resolveRouteUuidParam } from "@/lib/route-params";

/**
 * Resolves a `[id]` (uuid) route param. Uses the pathname when `useParams()` still returns
 * a Partial Prerender placeholder (`%%drp:id:…%%`) after client navigation.
 */
export const useRouteUuidParam = (paramKey = "id"): string | null => {
  const params = useParams();
  const pathname = usePathname();

  return useMemo(() => {
    const raw = params[paramKey];
    const value =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw) && typeof raw[0] === "string"
          ? raw[0]
          : undefined;
    return resolveRouteUuidParam(value, pathname);
  }, [params, paramKey, pathname]);
};
