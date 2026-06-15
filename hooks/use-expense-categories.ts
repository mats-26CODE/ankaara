"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";
import { toastMutationSuccess } from "@/lib/mutation-toast";
import type { Tables } from "@/database.types";

export const EXPENSE_CATEGORIES_QUERY_KEY = ["expense-categories"] as const;

export type ExpenseCategory = Tables<"expense_categories">;

export const useExpenseCategories = (businessId: string | null) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .or(`business_id.is.null,business_id.eq.${businessId}`)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setCategories([]);
    } else {
      setCategories(data ?? []);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const otherCategory = categories.find((category) => category.is_other) ?? null;
  const selectableCategories = categories.filter((category) => !category.is_other);

  return { categories, selectableCategories, otherCategory, loading, refetch };
};

export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { business_id: string; name: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          business_id: payload.business_id,
          name: payload.name.trim(),
          is_other: false,
          sort_order: 500,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_CATEGORIES_QUERY_KEY });
      toastMutationSuccess(context, "Category added");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to add category");
    },
  });
};
