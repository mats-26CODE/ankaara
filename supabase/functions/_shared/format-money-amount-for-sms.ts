/** Plain "TZS 250,000" style for push/SMS copy. */
export const formatMoneyAmountForSms = (
  amount: number,
  currencyCode: string,
  locale = "en-US",
): string => {
  const code = (currencyCode || "TZS").trim() || "TZS";
  if (!Number.isFinite(amount)) return `${code} 0`;
  const decimalDigits = Number.isInteger(amount) ? 0 : 2;
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
  }).format(amount);
  return `${code} ${num}`;
};
