"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";

export type Client = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string | null;
};

export type CreateClientPayload = {
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type UpdateClientPayload = {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export const useClients = (businessId: string | null) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setClients([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      setClients([]);
    } else {
      setClients((data as Client[]) || []);
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { clients, loading, refetch };
};

export const useCreateClient = () => {
  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .insert({
          organization_id: payload.organization_id,
          name: payload.name,
          email: payload.email?.trim() || null,
          phone: payload.phone?.trim() || null,
          address: payload.address?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      ToastAlert.success("Client added successfully");
    },
    onError: (error: Error) => {
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
      return data as Client;
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
