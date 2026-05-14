/**
 * Format subscription plan amounts using DB `price_currency` (e.g. TZS, USD).
 * Avoids hardcoded "$0" for free tiers.
 */
export const formatPlanCurrency = (
  amount: number | null,
  currency: string | null,
): string | null => {
  if (amount === null || amount === undefined) return null;
  const code = (currency?.trim() || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: code,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const n = Number(amount);
    if (n === 0) return `${code} 0`;
    return `${code} ${n.toFixed(2)}`;
  }
};
