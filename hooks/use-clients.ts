"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { toastMutationSuccess } from "@/lib/mutation-toast";
import { usePreferencesStore } from "@/lib/stores/preferences-store";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import { buildOrIlikeClause } from "@/lib/supabase/table-search";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Client = Tables<"clients">;
export type CreateClientPayload = Pick<TablesInsert<"clients">, "business_id" | "name"> &
  Partial<Pick<TablesInsert<"clients">, "email" | "phone" | "address">>;
export type UpdateClientPayload = TablesUpdate<"clients"> & { id: string };
type UseClientsOptions = {
  includeWalkIn?: boolean;
  search?: string;
};

const DEFAULT_PAGE_SIZE = 10;

export const useClients = (
  businessId: string | null,
  page?: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  options: UseClientsOptions = {},
) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const usePagination = page != null && page >= 1 && pageSize >= 1;
  const includeWalkIn = options.includeWalkIn ?? true;

  const refetch = useCallback(async () => {
    if (!businessId) {
      setClients([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    let query = supabase
      .from("clients")
      .select("*", usePagination ? { count: "exact" } : undefined)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (!includeWalkIn) {
      query = query.eq("is_walk_in", false);
    }

    const searchClause = buildOrIlikeClause(
      ["name", "email", "phone", "address"],
      options.search ?? "",
    );
    if (searchClause) {
      query = query.or(searchClause);
    }

    if (usePagination) {
      const from = (page! - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      setClients([]);
      setTotalCount(null);
    } else {
      setClients(data ?? []);
      setTotalCount(usePagination ? (count ?? null) : (data?.length ?? 0));
    }
    setLoading(false);
  }, [businessId, usePagination, page, pageSize, includeWalkIn, options.search]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { clients, loading, refetch, totalCount };
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .insert({
          business_id: payload.business_id,
          name: payload.name,
          email: payload.email?.trim() || null,
          phone: payload.phone?.trim() || null,
          address: payload.address?.trim() || null,
          is_walk_in: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.clientAdded"));
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more clients.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(error.message || "Failed to add client");
    },
  });
};

export const useEnsureWalkInClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("ensure_walk_in_client", {
        p_business_id: businessId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to prepare walk-in customer");
    },
  });
};

export const useUpdateClient = () => {
  return useMutation({
    mutationFn: async (payload: UpdateClientPayload) => {
      const supabase = createClient();
      const { id, ...fields } = payload;

      const { data: existingClient, error: clientError } = await supabase
        .from("clients")
        .select("is_walk_in")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;

      if (existingClient?.is_walk_in) {
        throw new Error("The walk-in customer is required for sales and cannot be edited.");
      }

      const updateFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) updateFields[key] = value;
      }

      const { data, error } = await supabase
        .from("clients")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.clientUpdated"));
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update client");
    },
  });
};

export const useDeleteClient = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("is_walk_in")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;

      if (client?.is_walk_in) {
        throw new Error("The walk-in customer is required for sales and cannot be deleted.");
      }

      const { count } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("client_id", id);

      if (count && count > 0) {
        throw new Error("Cannot delete this client — they still have invoices. Remove them first.");
      }

      const { count: salesCount } = await supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("client_id", id);

      if (salesCount && salesCount > 0) {
        throw new Error("Cannot delete this client — they still have sales records.");
      }

      const { count: loanCount } = await supabase
        .from("loans")
        .select("id", { count: "exact", head: true })
        .eq("client_id", id);

      if (loanCount && loanCount > 0) {
        throw new Error("Cannot delete this client — they still have loan records.");
      }

      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, usePreferencesStore.getState().t("dashboard.toast.clientDeleted"));
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete client");
    },
  });
};
