"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ensureRowId, type SupabaseRowId } from "@/lib/ensure-supabase-row-id";
import { runSupabaseDetailQueryWithRetry } from "@/lib/supabase/detail-fetch-retry";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import { ToastAlert } from "@/config/toast";
import { isPlanLimitError, getSubscribeUrlForPlanLimit } from "@/lib/subscription-limits";
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
  if (message.includes("INVOICE_STATUS_NOT_ELIGIBLE_FOR_SALE_CONVERSION")) {
    return "Only sent, viewed, or paid invoices can be converted to a sale.";
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
  const latestIdRef = useRef(saleId);
  latestIdRef.current = saleId;

  const refetch = useCallback(async () => {
    if (!saleId) {
      setSale(null);
      setLoading(false);
      return;
    }

    const requestedId = saleId;
    const supabase = createClient();
    const { data, error } = await runSupabaseDetailQueryWithRetry(supabase, async () =>
      supabase
        .from("sales")
        .select(
          "*, client:clients(id, name, email, phone, address), invoice:invoices(id, invoice_number, status)",
        )
        .eq("id", requestedId)
        .single(),
    );

    if (latestIdRef.current !== requestedId) return;

    if (error) {
      setSale(null);
      setLoading(false);
      return;
    }

    const { data: items } = await runSupabaseDetailQueryWithRetry(supabase, async () =>
      supabase
        .from("sale_items")
        .select("*, product:products(id, name)")
        .eq("sale_id", requestedId)
        .order("id", { ascending: true }),
    );

    if (latestIdRef.current !== requestedId) return;

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
  const latestIdRef = useRef(invoiceId);
  latestIdRef.current = invoiceId;

  const refetch = useCallback(async () => {
    if (!invoiceId) {
      setSale(null);
      setLoading(false);
      return;
    }

    const requestedId = invoiceId;
    const supabase = createClient();
    const { data, error } = await runSupabaseDetailQueryWithRetry(supabase, async () =>
      supabase.from("sales").select("*").eq("invoice_id", requestedId).maybeSingle(),
    );

    if (latestIdRef.current !== requestedId) return;

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
    mutationFn: async (payload: CreateDirectSalePayload): Promise<SupabaseRowId> => {
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
      const raw = data as unknown;
      const row = Array.isArray(raw) ? raw[0] : raw;
      if (!row || typeof row !== "object") {
        throw new Error("Invalid response from create_direct_sale");
      }
      return { id: ensureRowId(row as { id?: unknown }, "create_direct_sale") };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Sale recorded");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to record more sales this month.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(getSalesErrorMessage(error.message) || "Failed to record sale");
    },
  });
};

export const useConvertInvoiceToSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConvertInvoiceToSalePayload): Promise<SupabaseRowId> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("convert_invoice_to_sale", {
        p_invoice_id: payload.invoice_id,
        p_sale_date: payload.sale_date,
      });

      if (error) throw error;
      const raw = data as unknown;
      const row = Array.isArray(raw) ? raw[0] : raw;
      if (!row || typeof row !== "object") {
        throw new Error("Invalid response from convert_invoice_to_sale");
      }
      return { id: ensureRowId(row as { id?: unknown }, "convert_invoice_to_sale") };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Invoice converted to sale");
    },
    onError: (error: Error) => {
      if (isPlanLimitError(error)) {
        ToastAlert.error("Plan limit reached. Upgrade to record more sales this month.");
        if (typeof window !== "undefined")
          window.location.assign(getSubscribeUrlForPlanLimit(error));
        return;
      }
      ToastAlert.error(getSalesErrorMessage(error.message) || "Failed to convert invoice");
    },
  });
};
