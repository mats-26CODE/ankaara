"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";

export type Currency = Pick<
  Tables<"currencies">,
  "code" | "name" | "symbol" | "decimal_digits" | "symbol_position" | "space_between"
>;

let cachedCurrencies: Currency[] | null = null;

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState<Currency[]>(cachedCurrencies ?? []);
  const [loading, setLoading] = useState(!cachedCurrencies);

  useEffect(() => {
    if (cachedCurrencies) return;

    const fetch = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("currencies")
        .select("code, name, symbol, decimal_digits, symbol_position, space_between")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        cachedCurrencies = data;
        setCurrencies(data);
      }
      setLoading(false);
    };

    fetch();
  }, []);

  return { currencies, loading };
};

/**
 * Look up a currency by code from a pre-fetched list.
 */
export const findCurrency = (
  currencies: Currency[],
  code: string
): Currency | undefined => currencies.find((c) => c.code === code);
