/**
 * Helpers for server-side table search with PostgREST .or() + ilike filters.
 */

/** Sanitize user input for ilike patterns and .or() clause lists. */
export const sanitizeSearchTerm = (raw: string): string =>
  raw
    .trim()
    .replace(/,/g, " ")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

export const toIlikePattern = (raw: string): string => {
  const term = sanitizeSearchTerm(raw);
  return term ? `%${term}%` : "";
};

/** Build `col.ilike.%term%,...` for Supabase .or(). Returns null when term is empty. */
export const buildOrIlikeClause = (columns: string[], raw: string): string | null => {
  const pattern = toIlikePattern(raw);
  if (!pattern) return null;
  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
};
