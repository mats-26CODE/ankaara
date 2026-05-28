"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  buildOrIlikeClause,
  sanitizeSearchTerm,
  toIlikePattern,
} from "@/lib/supabase/table-search";
import { ToastAlert } from "@/config/toast";
import { DASHBOARD_STATS_QUERY_KEY } from "@/hooks/use-dashboard-stats";
import type { Json, Tables } from "@/database.types";

export const LOANS_QUERY_KEY = ["loans"] as const;

export type Loan = Tables<"loans"> & {
  client?: Pick<Tables<"clients">, "id" | "name" | "phone" | "email"> | null;
};
export type LoanItem = Tables<"loan_items"> & {
  product?: Pick<Tables<"products">, "id" | "name"> | null;
};
export type LoanPayment = Tables<"loan_payments">;

export type CreateLoanItemInput = {
  product_id: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
};

export type CreateLoanPayload = {
  business_id: string;
  client_id: string;
  loan_date: string;
  currency: string;
  notes?: string | null;
  items: CreateLoanItemInput[];
};

const fetchClientIdsMatchingSearch = async (
  businessId: string,
  search: string,
): Promise<string[]> => {
  const pattern = toIlikePattern(search);
  if (!pattern) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("business_id", businessId)
    .ilike("name", pattern);

  return data?.map((client) => client.id) ?? [];
};

export const useLoans = (
  businessId: string | null,
  page: number = 1,
  pageSize: number = 10,
  fromDate?: string | null,
  toDate?: string | null,
  search?: string,
) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setLoans([]);
      setTotalCount(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("loans")
      .select("*, client:clients(id, name, phone, email)", { count: "exact" })
      .eq("business_id", businessId)
      .order("loan_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fromDate) query = query.gte("loan_date", fromDate);
    if (toDate) query = query.lte("loan_date", toDate);

    const trimmedSearch = sanitizeSearchTerm(search ?? "");
    if (trimmedSearch) {
      const loanNumberClause = buildOrIlikeClause(["loan_number"], trimmedSearch);
      const matchingClientIds = await fetchClientIdsMatchingSearch(businessId, trimmedSearch);

      if (matchingClientIds.length > 0 && loanNumberClause) {
        query = query.or(`${loanNumberClause},client_id.in.(${matchingClientIds.join(",")})`);
      } else if (loanNumberClause) {
        query = query.or(loanNumberClause);
      } else if (matchingClientIds.length > 0) {
        query = query.in("client_id", matchingClientIds);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      setLoans([]);
      setTotalCount(null);
    } else {
      setLoans((data as Loan[]) ?? []);
      setTotalCount(count ?? null);
    }
    setLoading(false);
  }, [businessId, page, pageSize, fromDate, toDate, search]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { loans, loading, totalCount, refetch };
};

export const useLoan = (loanId: string | null) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [items, setItems] = useState<LoanItem[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const latestIdRef = useRef(loanId);
  latestIdRef.current = loanId;

  const refetch = useCallback(async () => {
    if (!loanId) {
      setLoan(null);
      setItems([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    const requestedId = loanId;
    const supabase = createClient();

    const { data: loanData, error } = await supabase
      .from("loans")
      .select("*, client:clients(id, name, phone, email, created_at)")
      .eq("id", requestedId)
      .single();

    if (latestIdRef.current !== requestedId) return;
    if (error) {
      setLoan(null);
      setItems([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data: itemData } = await supabase
      .from("loan_items")
      .select("*, product:products(id, name)")
      .eq("loan_id", requestedId)
      .order("id", { ascending: true });

    const { data: paymentData } = await supabase
      .from("loan_payments")
      .select("*")
      .eq("loan_id", requestedId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (latestIdRef.current !== requestedId) return;

    setLoan((loanData as Loan) ?? null);
    setItems((itemData as LoanItem[]) ?? []);
    setPayments((paymentData as LoanPayment[]) ?? []);
    setLoading(false);
  }, [loanId]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  return { loan, items, payments, loading, refetch };
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateLoanPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_loan", {
        p_business_id: payload.business_id,
        p_client_id: payload.client_id,
        p_loan_date: payload.loan_date,
        p_currency: payload.currency,
        p_notes: payload.notes?.trim() || undefined,
        p_items: payload.items as unknown as Json,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Loan recorded");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to record loan");
    },
  });
};

export const useRecordLoanPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      loan_id: string;
      amount: number;
      payment_date?: string;
      method?: string;
      reference?: string | null;
      notes?: string | null;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("record_loan_payment", {
        p_loan_id: payload.loan_id,
        p_amount: payload.amount,
        p_payment_date: payload.payment_date ?? new Date().toISOString().slice(0, 10),
        p_method: payload.method ?? "cash",
        p_reference: payload.reference ?? undefined,
        p_notes: payload.notes ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      ToastAlert.success("Loan payment recorded");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to record payment");
    },
  });
};

export const useClearLoanToSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { loan_id: string; sale_date?: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("clear_loan_to_sale", {
        p_loan_id: payload.loan_id,
        p_sale_date: payload.sale_date ?? new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_QUERY_KEY });
      ToastAlert.success("Loan converted to sale");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to clear loan");
    },
  });
};

export const useCreateInvoiceFromLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { loan_id: string; issue_date?: string; due_date?: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_invoice_from_loan", {
        p_loan_id: payload.loan_id,
        p_issue_date: payload.issue_date ?? new Date().toISOString().slice(0, 10),
        p_due_date: payload.due_date ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      ToastAlert.success("Invoice generated from loan");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to create invoice");
    },
  });
};
