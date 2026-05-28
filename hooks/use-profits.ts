"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProfitSummary = {
  grossSales: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export const useProfitSummary = (
  businessId: string | null,
  fromDate?: string | null,
  toDate?: string | null,
) => {
  const [summary, setSummary] = useState<ProfitSummary>({
    grossSales: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setSummary({
        grossSales: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
      });
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let salesQuery = supabase
      .from("sales")
      .select("total, total_cost, profit")
      .eq("business_id", businessId);
    let expenseQuery = supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId);

    if (fromDate) {
      salesQuery = salesQuery.gte("sale_date", fromDate);
      expenseQuery = expenseQuery.gte("expense_date", fromDate);
    }
    if (toDate) {
      salesQuery = salesQuery.lte("sale_date", toDate);
      expenseQuery = expenseQuery.lte("expense_date", toDate);
    }

    const [{ data: sales }, { data: expenses }] = await Promise.all([salesQuery, expenseQuery]);

    const grossSales = (sales ?? []).reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
    const cogs = (sales ?? []).reduce((sum, sale) => sum + (Number(sale.total_cost) || 0), 0);
    const grossProfit = (sales ?? []).reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);
    const expenseTotal = (expenses ?? []).reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0,
    );

    setSummary({
      grossSales,
      cogs,
      grossProfit,
      expenses: expenseTotal,
      netProfit: grossProfit - expenseTotal,
    });
    setLoading(false);
  }, [businessId, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { summary, loading, refetch };
};
