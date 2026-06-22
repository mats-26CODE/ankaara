"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { toastMutationSuccess } from "@/lib/mutation-toast";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import { useBusinessStore } from "@/lib/stores/business-store";
import { resolveDefaultBusinessId } from "@/lib/business-selection";
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
      useBusinessStore.getState().setCurrentBusiness(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const ownedBusinesses = data ?? [];

    const { data: staffLinks, error: staffError } = await supabase
      .from("business_staff")
      .select("business_id, invited_at, businesses(*)")
      .eq("user_id", user.id)
      .in("status", ["pending", "active"]);

    if (staffError) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const staffBusinesses = (staffLinks ?? [])
      .map((row) => row.businesses as Business | null)
      .filter((business): business is Business => business != null);

    const merged = new Map<string, Business>();
    for (const business of [...ownedBusinesses, ...staffBusinesses]) {
      merged.set(business.id, business);
    }
    const rows = Array.from(merged.values());
    const currentBusinessId = useBusinessStore.getState().currentBusinessId;
    const nextBusinessId = resolveDefaultBusinessId(
      rows,
      ownedBusinesses,
      (staffLinks ?? []).map((link) => ({
        business_id: link.business_id,
        invited_at: link.invited_at,
      })),
      currentBusinessId,
    );

    if (rows.length === 0) {
      useBusinessStore.getState().setCurrentBusiness(null);
    } else if (nextBusinessId && nextBusinessId !== currentBusinessId) {
      useBusinessStore.getState().setCurrentBusiness(nextBusinessId);
    }

    setBusinesses(rows);
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

      const contextBusinessId = useBusinessStore.getState().currentBusinessId;

      if (!payload.name?.trim()) throw new Error("Business name is required");

      const { data, error } = await supabase.rpc("create_business_for_account", {
        p_context_business_id: contextBusinessId,
        p_name: payload.name.trim(),
        p_currency: payload.currency ?? "TZS",
        p_address: payload.address?.trim() || null,
        p_tax_number: payload.tax_number?.trim() || null,
        p_capacity: payload.capacity?.trim() || null,
        p_logo_url: payload.logo_url || null,
        p_logo_text: payload.logo_text?.trim() || null,
        p_brand_color: payload.brand_color || null,
        p_is_primary: payload.is_primary ?? false,
      });

      if (error) throw error;
      return data as Business;
    },
    onSuccess: (data, _variables, _onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      if (data?.is_primary) {
        useBusinessStore.getState().setCurrentBusiness(data.id);
      }
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.businessCreated"));
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more businesses.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
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
    onSuccess: (data, _variables, _onMutateResult, context) => {
      if (data?.is_primary) {
        useBusinessStore.getState().setCurrentBusiness(data.id);
      }
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.businessUpdated"));
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
        throw new Error("Cannot delete this business — it still has clients. Remove them first.");
      }

      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id);

      if (invoiceCount && invoiceCount > 0) {
        throw new Error("Cannot delete this business — it still has invoices. Remove them first.");
      }

      const { error } = await supabase.from("businesses").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.businessDeleted"));
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete business");
    },
  });
};
