"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import type { Tables } from "@/database.types";

export type QuotationStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "expired"
  | "cancelled";

export type QuotationItem = Tables<"quotation_items">;

export type Quotation = Tables<"quotations"> & {
  status: QuotationStatus;
  client?: Pick<Tables<"clients">, "id" | "name" | "email" | "phone" | "address">;
  business?: Pick<
    Tables<"businesses">,
    "id" | "name" | "address" | "logo_url" | "logo_text" | "tax_number" | "brand_color" | "currency"
  >;
  items?: QuotationItem[];
};

export type QuotationItemInput = {
  id?: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
};

export type CreateQuotationPayload = {
  business_id: string;
  client_id: string;
  issue_date: string;
  valid_until?: string | null;
  currency: string;
  tax: number;
  tax_percentage?: number;
  notes?: string;
  scope_of_work?: string | null;
  template_id?: string;
  accent_color?: string;
  footer_note?: string;
  items: QuotationItemInput[];
};

export type UpdateQuotationPayload = {
  id: string;
  client_id?: string;
  issue_date?: string;
  valid_until?: string | null;
  currency?: string;
  tax?: number;
  tax_percentage?: number;
  notes?: string | null;
  scope_of_work?: string | null;
  template_id?: string;
  accent_color?: string | null;
  footer_note?: string | null;
  items?: QuotationItemInput[];
};

const lineTotal = (item: QuotationItemInput) =>
  item.quantity * item.unit_price - (item.discount ?? 0);

const computeTotals = (items: QuotationItemInput[], tax: number) => {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  return { subtotal, tax, total: subtotal + tax, totalDiscount };
};

const DEFAULT_PAGE_SIZE = 10;

export const useQuotations = (
  businessId: string | null,
  statusFilter?: QuotationStatus | null,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setQuotations([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("quotations")
      .select("*, client:clients(id, name, email, phone, address)", {
        count: "exact",
      })
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      setQuotations([]);
      setTotalCount(null);
    } else {
      setQuotations((data as unknown as Quotation[]) ?? []);
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, statusFilter, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { quotations, loading, refetch, totalCount };
};

export const useQuotation = (quotationId: string | null) => {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!quotationId) {
      setQuotation(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quotations")
      .select(
        "*, client:clients(id, name, email, phone, address), business:businesses!quotations_business_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)",
      )
      .eq("id", quotationId)
      .single();

    if (error) {
      setQuotation(null);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotationId)
      .order("id", { ascending: true });

    setQuotation({
      ...(data as unknown as Quotation),
      items: (items as QuotationItem[]) ?? [],
    });
    setLoading(false);
  }, [quotationId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { quotation, loading, refetch };
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateQuotationPayload) => {
      const supabase = createClient();
      const { subtotal, tax, total } = computeTotals(payload.items, payload.tax);

      const { data: quoNumData, error: quoNumError } = await supabase.rpc("next_quotation_number", {
        p_business_id: payload.business_id,
      });
      if (quoNumError) throw quoNumError;

      const { data, error } = await supabase
        .from("quotations")
        .insert({
          business_id: payload.business_id,
          client_id: payload.client_id,
          quotation_number: quoNumData as string,
          issue_date: payload.issue_date,
          valid_until: payload.valid_until?.trim() || null,
          currency: payload.currency,
          subtotal,
          tax,
          tax_percentage: payload.tax_percentage ?? 0,
          total,
          template_id: payload.template_id || "classic",
          accent_color: payload.accent_color?.trim() || null,
          footer_note: payload.footer_note?.trim() || null,
          notes: payload.notes?.trim() || null,
          scope_of_work: payload.scope_of_work?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      const quotation = data;

      if (payload.items.length > 0) {
        const rows = payload.items.map((item) => ({
          quotation_id: quotation.id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount ?? 0,
          total: item.quantity * item.unit_price - (item.discount ?? 0),
        }));
        const { error: itemsError } = await supabase.from("quotation_items").insert(rows);
        if (itemsError) throw itemsError;
      }

      return quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Quotation created");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to create more quotations.");
        if (typeof window !== "undefined") window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(error.message || "Failed to create quotation");
    },
  });
};

export const useUpdateQuotation = () => {
  return useMutation({
    mutationFn: async (payload: UpdateQuotationPayload) => {
      const supabase = createClient();
      const updates: Record<string, unknown> = {};

      if (payload.client_id) updates.client_id = payload.client_id;
      if (payload.issue_date) updates.issue_date = payload.issue_date;
      if (payload.valid_until !== undefined) updates.valid_until = payload.valid_until?.trim() || null;
      if (payload.currency) updates.currency = payload.currency;
      if (payload.template_id) updates.template_id = payload.template_id;
      if (payload.accent_color !== undefined)
        updates.accent_color = payload.accent_color?.trim() || null;
      if (payload.footer_note !== undefined)
        updates.footer_note = payload.footer_note?.trim() || null;
      if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;
      if (payload.scope_of_work !== undefined)
        updates.scope_of_work = payload.scope_of_work?.trim() || null;

      if (payload.items) {
        const { subtotal, tax, total } = computeTotals(payload.items, payload.tax ?? 0);
        updates.subtotal = subtotal;
        updates.tax = tax;
        updates.total = total;
        if (payload.tax_percentage !== undefined) updates.tax_percentage = payload.tax_percentage;
      } else {
        if (payload.tax !== undefined) updates.tax = payload.tax;
        if (payload.tax_percentage !== undefined) updates.tax_percentage = payload.tax_percentage;
      }

      const { data, error } = await supabase
        .from("quotations")
        .update(updates)
        .eq("id", payload.id)
        .select()
        .single();
      if (error) throw error;

      if (payload.items) {
        await supabase.from("quotation_items").delete().eq("quotation_id", payload.id);

        if (payload.items.length > 0) {
          const rows = payload.items.map((item) => ({
            quotation_id: payload.id,
            product_id: item.product_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount ?? 0,
            total: item.quantity * item.unit_price - (item.discount ?? 0),
          }));
          const { error: itemsError } = await supabase.from("quotation_items").insert(rows);
          if (itemsError) throw itemsError;
        }
      }

      return data as unknown as Quotation;
    },
    onSuccess: () => {
      ToastAlert.success("Quotation updated");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update quotation");
    },
  });
};

export const useCancelQuotation = () => {
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quotations")
        .update({ status: "cancelled" })
        .eq("id", quotationId)
        .in("status", ["draft", "sent", "viewed"])
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Quotation;
    },
    onSuccess: () => {
      ToastAlert.success("Quotation cancelled");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to cancel quotation");
    },
  });
};

export const useSendQuotation = () => {
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quotations")
        .update({ status: "sent" })
        .eq("id", quotationId)
        .eq("status", "draft")
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Quotation;
    },
    onSuccess: () => {
      ToastAlert.success("Quotation marked as sent");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to send quotation");
    },
  });
};

export const useDeleteQuotation = () => {
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const supabase = createClient();

      await supabase.from("quotation_items").delete().eq("quotation_id", quotationId);
      const { error } = await supabase.from("quotations").delete().eq("id", quotationId);
      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Quotation deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete quotation");
    },
  });
};
