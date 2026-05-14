import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ensures the browser Supabase client has a usable session before RLS queries.
 * - `getSession()` reads from local storage quickly.
 * - `getUser()` validates with the server and refreshes the JWT; critical on
 *   mobile Safari after client-side navigations where the first query could
 *   otherwise run before the client has fully attached the session.
 */
export const awaitClientSession = async (supabase: SupabaseClient) => {
  await supabase.auth.getSession();
  await supabase.auth.getUser();
};
