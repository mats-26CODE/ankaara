"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ensureRowId, type SupabaseRowId } from "@/lib/ensure-supabase-row-id";
import { runSupabaseDetailQueryWithRetry } from "@/lib/supabase/detail-fetch-retry";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
import { buildOrIlikeClause } from "@/lib/supabase/table-search";
import type { Tables } from "@/database.types";

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

export type InvoiceItem = Tables<"invoice_items">;

export type Invoice = Tables<"invoices"> & {
  status: InvoiceStatus;
  /** Present on list rows when a sale already exists for this invoice */
  linked_sale_id?: string | null;
  client?: Pick<Tables<"clients">, "id" | "name" | "email" | "phone" | "address">;
  business?: Pick<
    Tables<"businesses">,
    "id" | "name" | "address" | "logo_url" | "logo_text" | "tax_number" | "brand_color" | "currency"
  >;
  items?: InvoiceItem[];
};

export type InvoiceItemInput = {
  id?: string;
  product_id?: string | null;
  item_type?: string;
  base_price?: number;
  stock_quantity?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
};

export type CreateInvoicePayload = {
  business_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax: number;
  tax_percentage?: number;
  notes?: string;
  template_id?: string;
  accent_color?: string;
  footer_note?: string;
  quotation_id?: string | null;
  items: InvoiceItemInput[];
};

export type UpdateInvoicePayload = {
  id: string;
  client_id?: string;
  issue_date?: string;
  due_date?: string;
  currency?: string;
  tax?: number;
  tax_percentage?: number;
  notes?: string | null;
  template_id?: string;
  accent_color?: string | null;
  footer_note?: string | null;
  quotation_id?: string | null;
  items?: InvoiceItemInput[];
};

const lineTotal = (item: InvoiceItemInput) =>
  item.quantity * item.unit_price - (item.discount ?? 0);

const computeTotals = (items: InvoiceItemInput[], tax: number) => {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  return { subtotal, tax, total: subtotal + tax, totalDiscount };
};

const DEFAULT_PAGE_SIZE = 10;

export const useInvoices = (
  businessId: string | null,
  statusFilter?: InvoiceStatus | null,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  search?: string,
) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setInvoices([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("invoices")
      .select("*, client:clients(id, name, email, phone, address)", {
        count: "exact",
      })
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const searchClause = buildOrIlikeClause(
      ["invoice_number", "notes", "clients.name"],
      search ?? "",
    );
    if (searchClause) {
      query = query.or(searchClause);
    }

    const { data, error, count } = await query;

    if (error) {
      setInvoices([]);
      setTotalCount(null);
    } else {
      const rows = (data as unknown as Invoice[]) ?? [];
      if (rows.length === 0) {
        setInvoices([]);
      } else {
        const ids = rows.map((r) => r.id);
        const { data: saleLinks, error: saleLinksError } = await supabase
          .from("sales")
          .select("id, invoice_id")
          .in("invoice_id", ids);
        const byInvoice = new Map<string, string>();
        if (!saleLinksError && saleLinks) {
          for (const s of saleLinks) {
            if (s.invoice_id) byInvoice.set(s.invoice_id, s.id);
          }
        }
        setInvoices(
          rows.map((inv) => ({
            ...inv,
            linked_sale_id: byInvoice.get(inv.id) ?? null,
          })),
        );
      }
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, statusFilter, page, pageSize, search]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { invoices, loading, refetch, totalCount };
};

export const useInvoice = (invoiceId: string | null) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const latestIdRef = useRef(invoiceId);
  latestIdRef.current = invoiceId;

  const refetch = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null);
      setLoading(false);
      return;
    }

    const requestedId = invoiceId;
    const supabase = createClient();
    const { data, error } = await runSupabaseDetailQueryWithRetry(supabase, async () =>
      supabase
        .from("invoices")
        .select(
          "*, client:clients(id, name, email, phone, address), business:businesses!invoices_business_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)",
        )
        .eq("id", requestedId)
        .single(),
    );

    if (latestIdRef.current !== requestedId) return;

    if (error) {
      setInvoice(null);
      setLoading(false);
      return;
    }

    const { data: items } = await runSupabaseDetailQueryWithRetry(supabase, async () =>
      supabase.from("invoice_items").select("*").eq("invoice_id", requestedId).order("id", {
        ascending: true,
      }),
    );

    if (latestIdRef.current !== requestedId) return;

    setInvoice({
      ...(data as unknown as Invoice),
      items: (items as InvoiceItem[]) ?? [],
    });
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { invoice, loading, refetch };
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload): Promise<SupabaseRowId> => {
      const supabase = createClient();
      const { subtotal, tax, total } = computeTotals(payload.items, payload.tax);

      const { data: invNumData, error: invNumError } = await supabase.rpc("next_invoice_number", {
        p_business_id: payload.business_id,
      });
      if (invNumError) throw invNumError;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          business_id: payload.business_id,
          client_id: payload.client_id,
          invoice_number: invNumData as string,
          issue_date: payload.issue_date,
          due_date: payload.due_date,
          currency: payload.currency,
          subtotal,
          tax,
          tax_percentage: payload.tax_percentage ?? 0,
          total,
          template_id: payload.template_id || "classic",
          accent_color: payload.accent_color?.trim() || null,
          footer_note: payload.footer_note?.trim() || null,
          notes: payload.notes?.trim() || null,
          quotation_id: payload.quotation_id ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;
      const insertedId = ensureRowId(data, "Invoice insert");

      if (payload.items.length > 0) {
        const rows = payload.items.map((item) => ({
          invoice_id: insertedId,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount ?? 0,
          total: item.quantity * item.unit_price - (item.discount ?? 0),
        }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(rows);
        if (itemsError) throw itemsError;
      }

      return { id: insertedId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Invoice created");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to create more invoices.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(error.message || "Failed to create invoice");
    },
  });
};

export const useUpdateInvoice = () => {
  return useMutation({
    mutationFn: async (payload: UpdateInvoicePayload): Promise<SupabaseRowId> => {
      const supabase = createClient();
      const updates: Record<string, unknown> = {};

      if (payload.client_id) updates.client_id = payload.client_id;
      if (payload.issue_date) updates.issue_date = payload.issue_date;
      if (payload.due_date) updates.due_date = payload.due_date;
      if (payload.currency) updates.currency = payload.currency;
      if (payload.template_id) updates.template_id = payload.template_id;
      if (payload.accent_color !== undefined)
        updates.accent_color = payload.accent_color?.trim() || null;
      if (payload.footer_note !== undefined)
        updates.footer_note = payload.footer_note?.trim() || null;
      if (payload.notes !== undefined) updates.notes = payload.notes?.trim() || null;
      if (payload.quotation_id !== undefined) updates.quotation_id = payload.quotation_id ?? null;

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

      const { data: afterUpdate, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", payload.id)
        .select("id")
        .single();
      if (error) throw error;
      const rowId = ensureRowId(afterUpdate, "Invoice update");

      if (payload.items) {
        await supabase.from("invoice_items").delete().eq("invoice_id", payload.id);

        if (payload.items.length > 0) {
          const rows = payload.items.map((item) => ({
            invoice_id: payload.id,
            product_id: item.product_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount ?? 0,
            total: item.quantity * item.unit_price - (item.discount ?? 0),
          }));
          const { error: itemsError } = await supabase.from("invoice_items").insert(rows);
          if (itemsError) throw itemsError;
        }
      }

      return { id: rowId };
    },
    onSuccess: () => {
      ToastAlert.success("Invoice updated");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update invoice");
    },
  });
};

export const useSendInvoice = () => {
  return useMutation({
    mutationFn: async (invoiceId: string): Promise<SupabaseRowId> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId)
        .eq("status", "draft")
        .select("id")
        .single();
      if (error) throw error;
      return { id: ensureRowId(data, "Invoice send") };
    },
    onSuccess: () => {
      ToastAlert.success("Invoice marked as sent");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to send invoice");
    },
  });
};

export const useDeleteInvoice = () => {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const supabase = createClient();

      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      ToastAlert.success("Invoice deleted");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to delete invoice");
    },
  });
};
