"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, SUBSCRIBE_PATH } from "@/lib/subscription-limits";
import type { Tables } from "@/database.types";

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";

export type InvoiceItem = Tables<"invoice_items">;

export type Invoice = Tables<"invoices"> & {
  status: InvoiceStatus;
  client?: Pick<Tables<"clients">, "id" | "name" | "email" | "phone" | "address">;
  business?: Pick<
    Tables<"businesses">,
    "id" | "name" | "address" | "logo_url" | "logo_text" | "tax_number" | "brand_color" | "currency"
  >;
  items?: InvoiceItem[];
};

export type InvoiceItemInput = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
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
  items?: InvoiceItemInput[];
};

const computeTotals = (items: InvoiceItemInput[], tax: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return { subtotal, tax, total: subtotal + tax };
};

const DEFAULT_PAGE_SIZE = 10;

export const useInvoices = (
  businessId: string | null,
  statusFilter?: InvoiceStatus | null,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
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

    const { data, error, count } = await query;

    if (error) {
      setInvoices([]);
      setTotalCount(null);
    } else {
      setInvoices((data as unknown as Invoice[]) ?? []);
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, statusFilter, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { invoices, loading, refetch, totalCount };
};

export const useInvoice = (invoiceId: string | null) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "*, client:clients(id, name, email, phone, address), business:businesses!invoices_business_id_fkey(id, name, address, logo_url, logo_text, tax_number, brand_color, currency)",
      )
      .eq("id", invoiceId)
      .single();

    if (error) {
      setInvoice(null);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("id", { ascending: true });

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
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
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
        })
        .select()
        .single();

      if (error) throw error;
      const invoice = data;

      if (payload.items.length > 0) {
        const rows = payload.items.map((item) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
        }));
        const { error: itemsError } = await supabase.from("invoice_items").insert(rows);
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      ToastAlert.success("Invoice created");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to create more invoices.");
        if (typeof window !== "undefined") window.location.assign(SUBSCRIBE_PATH);
        return;
      }
      ToastAlert.error(error.message || "Failed to create invoice");
    },
  });
};

export const useUpdateInvoice = () => {
  return useMutation({
    mutationFn: async (payload: UpdateInvoicePayload) => {
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
        .from("invoices")
        .update(updates)
        .eq("id", payload.id)
        .select()
        .single();
      if (error) throw error;

      if (payload.items) {
        await supabase.from("invoice_items").delete().eq("invoice_id", payload.id);

        if (payload.items.length > 0) {
          const rows = payload.items.map((item) => ({
            invoice_id: payload.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
          }));
          const { error: itemsError } = await supabase.from("invoice_items").insert(rows);
          if (itemsError) throw itemsError;
        }
      }

      return data as unknown as Invoice;
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
    mutationFn: async (invoiceId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId)
        .eq("status", "draft")
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Invoice;
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
