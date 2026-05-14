import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the browser Supabase client has loaded the session from storage before
 * RLS-protected queries. Prevents transient "no rows" right after client-side navigation.
 */
export const awaitClientSession = async (supabase: SupabaseClient) => {
  await supabase.auth.getSession();
};
