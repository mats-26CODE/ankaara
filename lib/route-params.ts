/**
 * Next.js App Router dynamic segment helpers.
 *
 * With `cacheComponents: true` (Partial Prerender), `useParams()` can briefly return
 * placeholders like `%%drp:id:<buildId>%%` on client navigation before the real [id]
 * is available. Passing those to Supabase causes `22P02` (invalid uuid).
 */

/** Partial Prerender / dynamic route placeholder (not a real DB id). */
const DYNAMIC_ROUTE_PLACEHOLDER = /%%drp:|%%/;

/** Standard UUID v4 (Supabase primary keys). */
export const UUID_SEGMENT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isRouteSegmentReady = (value: string): boolean => {
  if (!value.length) return false;
  if (DYNAMIC_ROUTE_PLACEHOLDER.test(value)) return false;
  return true;
};

export const isUuidSegment = (value: string): boolean => UUID_SEGMENT_RE.test(value);

/**
 * Normalizes a dynamic segment from `useParams()`. Returns null while the segment is
 * missing or still a PPR placeholder.
 */
export const segmentParam = (value: string | string[] | undefined): string | null => {
  let raw: string | null = null;
  if (typeof value === "string" && value.length > 0) raw = value;
  else if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    raw = value[0];
  }
  if (!raw || !isRouteSegmentReady(raw)) return null;
  return raw;
};

/**
 * Like {@link segmentParam} but only accepts a valid UUID (use for `[id]` routes backed by uuid columns).
 */
export const segmentUuidParam = (value: string | string[] | undefined): string | null => {
  const raw = segmentParam(value);
  if (!raw || !isUuidSegment(raw)) return null;
  return raw;
};

/**
 * Reads a UUID from the URL path when `useParams()` is still a PPR placeholder but the
 * address bar already shows the real id (common on production client navigations).
 */
export const uuidFromPathname = (pathname: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (isUuidSegment(segment)) return segment;
  }
  return null;
};

/**
 * Prefer `useParams()`, fall back to {@link uuidFromPathname} so fetches are not blocked forever.
 */
export const resolveRouteUuidParam = (
  paramValue: string | string[] | undefined,
  pathname: string,
): string | null => {
  const fromParams = segmentUuidParam(paramValue);
  if (fromParams) return fromParams;
  return uuidFromPathname(pathname);
};
