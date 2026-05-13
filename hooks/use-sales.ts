"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import type { Json, Tables } from "@/database.types";

export const SALES_QUERY_KEY = ["sales"] as const;

export type Sale = Tables<"sales"> & {
  client?: Pick<Tables<"clients">, "id" | "name" | "email" | "phone" | "address"> | null;
  invoice?: Pick<Tables<"invoices">, "id" | "invoice_number" | "status"> | null;
  items?: SaleItem[];
};

export type SaleItem = Tables<"sale_items"> & {
  product?: Pick<Tables<"products">, "id" | "name"> | null;
};

type SaleRowFromList = Omit<Sale, "items"> & { sale_items?: SaleItem[] };

export type DirectSaleItemInput = {
  product_id: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
};

export type CreateDirectSalePayload = {
  business_id: string;
  client_id?: string | null;
  sale_date: string;
  currency: string;
  notes?: string | null;
  items: DirectSaleItemInput[];
};

export type ConvertInvoiceToSalePayload = {
  invoice_id: string;
  sale_date: string;
};

const getSalesErrorMessage = (message: string) => {
  if (message.includes("PRICE_BELOW_BASE")) {
    const basePrice = message.split(":").at(-1);
    return `Selling price cannot be below base price${basePrice ? ` (${basePrice})` : ""}.`;
  }
  if (message.includes("INSUFFICIENT_STOCK")) {
    const product = message.split(":").at(-1);
    return product ? `Insufficient stock for ${product}.` : "Insufficient stock.";
  }
  return message;
};

const DEFAULT_PAGE_SIZE = 10;

export const useSales = (
  businessId: string | null,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  fromDate?: string | null,
  toDate?: string | null,
) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setSales([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("sales")
      .select(
        "*, client:clients(id, name, email, phone, address), invoice:invoices(id, invoice_number, status), sale_items(id, quantity, description, item_type, product_id, product:products(id, name))",
        { count: "exact" },
      )
      .eq("business_id", businessId)
      .order("sale_date", { ascending: false })
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: true, foreignTable: "sale_items" })
      .range(from, to);

    if (fromDate) query = query.gte("sale_date", fromDate);
    if (toDate) query = query.lte("sale_date", toDate);

    const { data, error, count } = await query;

    if (error) {
      setSales([]);
      setTotalCount(null);
    } else {
      const rows = (data ?? []) as SaleRowFromList[];
      setSales(
        rows.map(({ sale_items, ...rest }) => ({
          ...rest,
          items: sale_items ?? [],
        })) as Sale[],
      );
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, page, pageSize, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { sales, loading, refetch, totalCount };
};

export const useSale = (saleId: string | null) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!saleId) {
      setSale(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales")
      .select(
        "*, client:clients(id, name, email, phone, address), invoice:invoices(id, invoice_number, status)",
      )
      .eq("id", saleId)
      .single();

    if (error) {
      setSale(null);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from("sale_items")
      .select("*, product:products(id, name)")
      .eq("sale_id", saleId)
      .order("id", { ascending: true });

    setSale({
      ...(data as unknown as Sale),
      items: (items as SaleItem[]) ?? [],
    });
    setLoading(false);
  }, [saleId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { sale, loading, refetch };
};

export const useSaleByInvoice = (invoiceId: string | null) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!invoiceId) {
      setSale(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("invoice_id", invoiceId)
      .maybeSingle();

    if (error) {
      setSale(null);
    } else {
      setSale((data as Sale | null) ?? null);
    }
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { sale, loading, refetch };
};

export const useCreateDirectSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDirectSalePayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_direct_sale", {
        p_business_id: payload.business_id,
        p_client_id: payload.client_id ?? undefined,
        p_sale_date: payload.sale_date,
        p_currency: payload.currency,
        p_notes: payload.notes?.trim() || undefined,
        p_items: payload.items as unknown as Json,
      });

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Sale recorded");
    },
    onError: (error: Error) => {
      ToastAlert.error(getSalesErrorMessage(error.message) || "Failed to record sale");
    },
  });
};

export const useConvertInvoiceToSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConvertInvoiceToSalePayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("convert_invoice_to_sale", {
        p_invoice_id: payload.invoice_id,
        p_sale_date: payload.sale_date,
      });

      if (error) throw error;
      return data as Sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Invoice converted to sale");
    },
    onError: (error: Error) => {
      ToastAlert.error(getSalesErrorMessage(error.message) || "Failed to convert invoice");
    },
  });
};
