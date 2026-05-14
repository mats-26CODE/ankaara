import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** After SPA navigation (especially mobile), the first request can run before cookies/session are applied. */
const SESSION_POLL_MS = 80;
const SESSION_MAX_WAIT_MS = 2400;

const DETAIL_FETCH_MAX_ATTEMPTS = 4;
const detailBackoffMs = (attemptIndex: number) => Math.min(750, 100 * 2 ** attemptIndex);

/**
 * PostgREST returns `PGRST116` for `.single()` when there are 0 rows — which also happens under RLS
 * when the JWT is not ready yet, so it is worth retrying a few times before showing "not found".
 */
export const isTransientDetailFetchError = (error: PostgrestError | null): boolean => {
  if (!error) return false;
  if (error.code === "PGRST116") return true;
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("jwt")) return true;
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to load"))
    return true;
  return false;
};

export const ensureSupabaseSessionReady = async (
  supabase: SupabaseClient,
  options?: { maxWaitMs?: number },
) => {
  const max = options?.maxWaitMs ?? SESSION_MAX_WAIT_MS;
  let waited = 0;
  while (waited < max) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return;
    await sleep(SESSION_POLL_MS);
    waited += SESSION_POLL_MS;
  }
};

/**
 * Waits for session, then runs `query` up to {@link DETAIL_FETCH_MAX_ATTEMPTS} times with backoff
 * when the error looks transient (session / RLS / network).
 */
export const runSupabaseDetailQueryWithRetry = async <T>(
  supabase: SupabaseClient,
  query: () => Promise<{ data: T | null; error: PostgrestError | null }>,
): Promise<{ data: T | null; error: PostgrestError | null }> => {
  await ensureSupabaseSessionReady(supabase);

  let last: { data: T | null; error: PostgrestError | null } = { data: null, error: null };

  for (let attempt = 0; attempt < DETAIL_FETCH_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(detailBackoffMs(attempt - 1));
    last = await query();
    if (!last.error) return last;
    if (!isTransientDetailFetchError(last.error)) return last;
  }

  return last;
};
