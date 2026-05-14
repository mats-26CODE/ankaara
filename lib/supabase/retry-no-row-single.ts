import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import { isPostgrestSingleNoRowError } from "@/lib/supabase/postgrest-errors";

type SingleResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Re-runs a `.single()` read when PostgREST returns PGRST116 (often transient
 * when RLS sees no session yet on mobile after client navigation).
 */
export const retryNoRowSingle = async <T>(
  supabase: SupabaseClient,
  query: () => PromiseLike<SingleResult<T>>,
  maxExtraAttempts = 2,
): Promise<SingleResult<T>> => {
  let result = await query();
  for (
    let i = 0;
    i < maxExtraAttempts && result.error && isPostgrestSingleNoRowError(result.error);
    i++
  ) {
    await supabase.auth.getUser();
    await new Promise((r) => setTimeout(r, 120 * (i + 1)));
    result = await query();
  }
  return result;
};
