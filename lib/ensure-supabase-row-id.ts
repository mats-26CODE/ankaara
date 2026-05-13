/**
 * Supabase `.insert().select("id")` / `.update().select("id")` return shape.
 */
export type SupabaseRowId = { id: string };

/**
 * Supabase `.insert().select()`, `.update().select()`, and RPCs should return the row `id`.
 * Use this after mutations so we never navigate or chain queries with a missing id.
 */
export const ensureRowId = (row: { id?: unknown } | null | undefined, context: string): string => {
  const id = row?.id;
  if (typeof id === "string" && id.length > 0) return id;
  throw new Error(`${context}: Supabase did not return a usable id`);
};
