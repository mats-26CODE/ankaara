"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, SUBSCRIBE_PATH } from "@/lib/subscription-limits";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type Client = Tables<"clients">;
export type CreateClientPayload = Pick<TablesInsert<"clients">, "business_id" | "name"> &
  Partial<Pick<TablesInsert<"clients">, "email" | "phone" | "address">>;
export type UpdateClientPayload = TablesUpdate<"clients"> & { id: string };

const DEFAULT_PAGE_SIZE = 10;

export const useClients = (
  businessId: string | null,
  page?: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const usePagination = page != null && page >= 1 && pageSize >= 1;

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
      setTotalCount(usePagination ? count ?? null : (data?.length ?? 0));
    }
    setLoading(false);
  }, [businessId, usePagination, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { clients, loading, refetch, totalCount };
};

export const useCreateClient = () => {
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
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("Client added successfully");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to add more clients.");
        if (typeof window !== "undefined") window.location.assign(SUBSCRIBE_PATH);
        return;
      }
      ToastAlert.error(error.message || "Failed to add client");
    },
  });
};

export const useUpdateClient = () => {
  return useMutation({
    mutationFn: async (payload: UpdateClientPayload) => {
      const supabase = createClient();
      const { id, ...fields } = payload;

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
    onSuccess: () => {
      ToastAlert.success("Client updated successfully");
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

      const { count } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("client_id", id);

      if (count && count > 0) {
        throw new Error(
          "Cannot delete this client — they still have invoices. Remove them first."
        );
      }

      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Client deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete client");
    },
  });
};
