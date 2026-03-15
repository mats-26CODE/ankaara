"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type InvoiceStats = {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  currency: string;
};

const defaultStats: InvoiceStats = {
  total: 0,
  draft: 0,
  sent: 0,
  paid: 0,
  overdue: 0,
  totalRevenue: 0,
  currency: "TZS",
};

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard-stats"] as const;

const fetchDashboardStats = async (
  userId: string | undefined,
): Promise<{
  invoiceStats: InvoiceStats;
  clientCount: number;
  productCount: number;
}> => {
  if (!userId) {
    return {
      invoiceStats: defaultStats,
      clientCount: 0,
      productCount: 0,
    };
  }

  const supabase = createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, currency")
    .eq("owner_id", userId);

  if (!businesses || businesses.length === 0) {
    return {
      invoiceStats: defaultStats,
      clientCount: 0,
      productCount: 0,
    };
  }

  const bizIds = businesses.map((b: { id: string }) => b.id);
  const currency = businesses[0]?.currency || "TZS";

  const { data: invoices } = await supabase
    .from("invoices")
    .select("status, total")
    .in("business_id", bizIds);

  const stats: InvoiceStats = { ...defaultStats, currency };

  if (invoices) {
    stats.total = invoices.length;
    for (const inv of invoices) {
      const s = inv.status as string;
      if (s === "draft") stats.draft++;
      else if (s === "sent" || s === "viewed") stats.sent++;
      else if (s === "paid") {
        stats.paid++;
        stats.totalRevenue += Number(inv.total) || 0;
      } else if (s === "overdue") stats.overdue++;
    }
  }

  const { count: clientCountResult } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .in("business_id", bizIds);

  const { count: productCountResult } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .in("business_id", bizIds);

  return {
    invoiceStats: stats,
    clientCount: clientCountResult || 0,
    productCount: productCountResult || 0,
  };
};

export const useDashboardStats = (userId: string | undefined) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...DASHBOARD_STATS_QUERY_KEY, userId ?? "anon"],
    queryFn: () => fetchDashboardStats(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  return {
    invoiceStats: data?.invoiceStats ?? defaultStats,
    clientCount: data?.clientCount ?? 0,
    productCount: data?.productCount ?? 0,
    loading: isLoading,
    refetch,
  };
};
