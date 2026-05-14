import type { PostgrestError } from "@supabase/supabase-js";

/** `.single()` when 0 or >1 rows match (includes RLS hiding all rows). */
export const isPostgrestSingleNoRowError = (error: PostgrestError | null | undefined): boolean =>
  error?.code === "PGRST116";
