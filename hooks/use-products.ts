"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Product = Tables<"products">;
export type InventoryMovement = Tables<"inventory_movements">;
export type ProductItemType = "product" | "service";
export type CreateProductPayload = Pick<TablesInsert<"products">, "business_id" | "name"> &
  Partial<
    Pick<
      TablesInsert<"products">,
      | "description"
      | "unit_price"
      | "unit"
      | "item_type"
      | "base_price"
      | "selling_price"
      | "stock_quantity"
      | "low_stock_threshold"
      | "sku"
      | "is_active"
    >
  >;
export type UpdateProductPayload = TablesUpdate<"products"> & { id: string };
export type AdjustProductStockPayload = {
  product_id: string;
  quantity_delta: number;
  movement_type?: "initial" | "adjustment" | "restock" | "rollback";
  reason?: string | null;
  unit_cost?: number | null;
};

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
      setTotalCount(usePagination ? (count ?? null) : (data?.length ?? 0));
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const supabase = createClient();
      const itemType = payload.item_type ?? "product";
      const sellingPrice = payload.selling_price ?? payload.unit_price ?? 0;
      const { data, error } = await supabase
        .from("products")
        .insert({
          business_id: payload.business_id,
          name: payload.name,
          description: payload.description?.trim() || null,
          item_type: itemType,
          base_price: payload.base_price ?? 0,
          selling_price: sellingPrice,
          unit_price: sellingPrice,
          stock_quantity: itemType === "service" ? 0 : (payload.stock_quantity ?? 0),
          low_stock_threshold:
            itemType === "service" ? null : (payload.low_stock_threshold ?? null),
          sku: payload.sku?.trim() || null,
          is_active: payload.is_active ?? true,
          unit: payload.unit?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Product added successfully");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more products.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
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
      if (fields.selling_price !== undefined) {
        updateFields.unit_price = fields.selling_price;
      }
      if (fields.item_type === "service") {
        updateFields.stock_quantity = 0;
        updateFields.low_stock_threshold = null;
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

export const useInventoryMovements = (productId: string | null) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!productId) {
      setMovements([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setMovements([]);
    } else {
      setMovements((data as InventoryMovement[]) ?? []);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { movements, loading, refetch };
};

export const useAdjustProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AdjustProductStockPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("adjust_product_stock", {
        p_product_id: payload.product_id,
        p_quantity_delta: payload.quantity_delta,
        p_movement_type: payload.movement_type ?? "adjustment",
        p_reason: payload.reason ?? undefined,
        p_unit_cost: payload.unit_cost ?? undefined,
      });

      if (error) throw error;
      return data as InventoryMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Stock updated successfully");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update stock");
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
