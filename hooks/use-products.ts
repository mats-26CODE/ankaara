"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Product = Tables<"products">;
export type CreateProductPayload = Pick<TablesInsert<"products">, "business_id" | "name"> &
  Partial<Pick<TablesInsert<"products">, "description" | "unit_price" | "unit">>;
export type UpdateProductPayload = TablesUpdate<"products"> & { id: string };

const DEFAULT_PAGE_SIZE = 10;

export const useProducts = (
  businessId: string | null,
  page?: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const usePagination = page != null && page >= 1 && pageSize >= 1;

  const refetch = useCallback(async () => {
    if (!businessId) {
      setProducts([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*", usePagination ? { count: "exact" } : undefined)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (usePagination) {
      const from = (page! - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      setProducts([]);
      setTotalCount(null);
    } else {
      setProducts(data ?? []);
      setTotalCount(usePagination ? count ?? null : (data?.length ?? 0));
    }
    setLoading(false);
  }, [businessId, usePagination, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { products, loading, refetch, totalCount };
};

export const useCreateProduct = () => {
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .insert({
          business_id: payload.business_id,
          name: payload.name,
          description: payload.description?.trim() || null,
          unit_price: payload.unit_price ?? 0,
          unit: payload.unit?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("Product added successfully");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more products.");
        if (typeof window !== "undefined") window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(error.message || "Failed to add product");
    },
  });
};

export const useUpdateProduct = () => {
  return useMutation({
    mutationFn: async (payload: UpdateProductPayload) => {
      const supabase = createClient();
      const { id, ...fields } = payload;

      const updateFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) updateFields[key] = value;
      }

      const { data, error } = await supabase
        .from("products")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("Product updated successfully");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update product");
    },
  });
};

export const useDeleteProduct = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Product deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete product");
    },
  });
};
