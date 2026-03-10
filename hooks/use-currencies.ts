"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  decimal_digits: number;
  symbol_position: "left" | "right";
  space_between: boolean;
};

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
        const rows = data as Currency[];
        cachedCurrencies = rows;
        setCurrencies(rows);
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
