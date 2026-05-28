"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { buildOrIlikeClause, sanitizeSearchTerm } from "@/lib/supabase/table-search";
import { ToastAlert } from "@/config/toast";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Expense = Tables<"expenses">;
export type CreateExpensePayload = Pick<TablesInsert<"expenses">, "business_id" | "category" | "amount"> &
  Partial<Pick<TablesInsert<"expenses">, "expense_date" | "payment_method" | "notes">>;
export type UpdateExpensePayload = TablesUpdate<"expenses"> & { id: string };

const DEFAULT_PAGE_SIZE = 10;

export const useExpenses = (
  businessId: string | null,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  fromDate?: string | null,
  toDate?: string | null,
  search?: string,
) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setExpenses([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("business_id", businessId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("expense_date", fromDate);
    if (toDate) query = query.lte("expense_date", toDate);

    const trimmedSearch = sanitizeSearchTerm(search ?? "");
    if (trimmedSearch) {
      const searchClause = buildOrIlikeClause(["category", "notes", "payment_method"], trimmedSearch);
      if (searchClause) query = query.or(searchClause);
    }

    const { data, error, count } = await query;
    if (error) {
      setExpenses([]);
      setTotalCount(null);
    } else {
      setExpenses(data ?? []);
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, page, pageSize, fromDate, toDate, search]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { expenses, loading, totalCount, refetch };
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          business_id: payload.business_id,
          category: payload.category.trim(),
          amount: Number(payload.amount) || 0,
          expense_date: payload.expense_date ?? new Date().toISOString().slice(0, 10),
          payment_method: payload.payment_method?.trim() || "cash",
          notes: payload.notes?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Expense recorded successfully");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to record expense");
    },
  });
};

export const useUpdateExpense = () => {
  return useMutation({
    mutationFn: async (payload: UpdateExpensePayload) => {
      const supabase = createClient();
      const { id, ...fields } = payload;
      const updateFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) updateFields[key] = value;
      }
      const { data, error } = await supabase
        .from("expenses")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("Expense updated");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update expense");
    },
  });
};

export const useDeleteExpense = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Expense deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete expense");
    },
  });
};
