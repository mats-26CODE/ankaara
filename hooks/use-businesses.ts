"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Business = Tables<"businesses">;
export type CreateBusinessPayload = Omit<TablesInsert<"businesses">, "owner_id">;
export type UpdateBusinessPayload = TablesUpdate<"businesses"> & { id: string };

export const useBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      setBusinesses([]);
    } else {
      setBusinesses(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { businesses, loading, refetch };
};

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBusinessPayload) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: payload.name,
          currency: payload.currency,
          address: payload.address?.trim() || null,
          tax_number: payload.tax_number?.trim() || null,
          capacity: payload.capacity?.trim() || null,
          logo_url: payload.logo_url || null,
          logo_text: payload.logo_text?.trim() || null,
          brand_color: payload.brand_color || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Business created successfully");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more businesses.");
        if (typeof window !== "undefined") window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(error.message || "Failed to create business");
    },
  });
};

export const useUpdateBusiness = () => {
  return useMutation({
    mutationFn: async (payload: UpdateBusinessPayload) => {
      const supabase = createClient();
      const { id, ...fields } = payload;

      const updateFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) updateFields[key] = value;
      }

      const { data, error } = await supabase
        .from("businesses")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("Business updated successfully");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update business");
    },
  });
};

export const useDeleteBusiness = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id);

      if (count && count > 0) {
        throw new Error(
          "Cannot delete this business — it still has clients. Remove them first."
        );
      }

      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id);

      if (invoiceCount && invoiceCount > 0) {
        throw new Error(
          "Cannot delete this business — it still has invoices. Remove them first."
        );
      }

      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Business deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete business");
    },
  });
};
