/**
 * Normalizes a Next.js App Router dynamic segment (string or string[]) for client pages.
 */
export const segmentParam = (value: string | string[] | undefined): string | null => {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return null;
};
