"use client";

import { useCallback, useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useCurrencies, findCurrency, type Currency } from "@/hooks/use-currencies";
import { formatCurrency } from "@/helpers/helpers";

/**
 * Build a CurrencyConfig from a Currency row.
 * This bridges the DB-driven currency metadata to the existing formatCurrency helper.
 */
const toConfig = (
  c: Currency,
  overrides?: Partial<CurrencyConfig>
): CurrencyConfig => ({
  code: c.code,
  symbol: c.symbol,
  decimalDigits: c.decimal_digits,
  symbolPosition: c.symbol_position as "left" | "right",
  spaceBetween: c.space_between,
  ...overrides,
});

/**
 * Returns a `format` function that formats amounts using the current user's
 * preferred currency (from their profile) and the matching row in the
 * `currencies` table.
 *
 * Usage:
 * ```ts
 * const { format, currency } = useFormatAmount();
 * format(25000)           // "TSh 25,000"
 * format(25000, { compact: true }) // "TSh 25K"
 * ```
 */
export const useFormatAmount = () => {
  const { profile } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();

  const currency = useMemo(
    () =>
      findCurrency(currencies, profile?.preferred_currency ?? "TZS") ??
      findCurrency(currencies, "TZS"),
    [currencies, profile?.preferred_currency]
  );

  const format = useCallback(
    (
      amount: number,
      overrides?: Partial<CurrencyConfig>
    ): string => {
      if (!currency) {
        return formatCurrency(amount, { code: "TZS", ...overrides });
      }
      return formatCurrency(amount, toConfig(currency, overrides));
    },
    [currency]
  );

  return {
    format,
    currency,
    currencyCode: currency?.code ?? profile?.preferred_currency ?? "TZS",
    loading: currenciesLoading,
  };
};

/**
 * Standalone format for cases where you already have a currency code and
 * the currencies list (e.g. server components, non-hook contexts).
 */
export const formatAmount = (
  amount: number,
  currencyRow: Currency | undefined,
  overrides?: Partial<CurrencyConfig>
): string => {
  if (!currencyRow) {
    return formatCurrency(amount, { code: "TZS", ...overrides });
  }
  return formatCurrency(amount, toConfig(currencyRow, overrides));
};
