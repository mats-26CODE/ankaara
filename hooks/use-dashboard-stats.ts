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

export type SalesStats = {
  totalSales: number;
  totalProfit: number;
  todaySales: number;
  todayProfit: number;
  todayExpenses: number;
};

export type InventoryStats = {
  inventoryValue: number;
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

const defaultSalesStats: SalesStats = {
  totalSales: 0,
  totalProfit: 0,
  todaySales: 0,
  todayProfit: 0,
  todayExpenses: 0,
};

const defaultInventoryStats: InventoryStats = {
  inventoryValue: 0,
};

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard-stats"] as const;

const fetchDashboardStats = async (
  userId: string | undefined,
  businessId?: string | null,
): Promise<{
  invoiceStats: InvoiceStats;
  salesStats: SalesStats;
  inventoryStats: InventoryStats;
  clientCount: number;
  productCount: number;
  quotationCount: number;
}> => {
  if (!userId) {
    return {
      invoiceStats: defaultStats,
      salesStats: defaultSalesStats,
      inventoryStats: defaultInventoryStats,
      clientCount: 0,
      productCount: 0,
      quotationCount: 0,
    };
  }

  const supabase = createClient();

  let businessesQuery = supabase.from("businesses").select("id, currency").eq("owner_id", userId);

  if (businessId) {
    businessesQuery = businessesQuery.eq("id", businessId);
  }

  const { data: businesses } = await businessesQuery;

  if (!businesses || businesses.length === 0) {
    return {
      invoiceStats: defaultStats,
      salesStats: defaultSalesStats,
      inventoryStats: defaultInventoryStats,
      clientCount: 0,
      productCount: 0,
      quotationCount: 0,
    };
  }

  const bizIds = businesses.map((b: { id: string }) => b.id);
  const currency = businesses[0]?.currency || "TZS";

  const { data: invoices } = await supabase
    .from("invoices")
    .select("status, total")
    .in("business_id", bizIds);

  const stats: InvoiceStats = { ...defaultStats, currency };
  const salesStats: SalesStats = { ...defaultSalesStats };
  const inventoryStats: InventoryStats = { ...defaultInventoryStats };
  const today = new Date().toISOString().slice(0, 10);

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

  const { data: sales } = await supabase
    .from("sales")
    .select("sale_date, total, profit")
    .in("business_id", bizIds);

  if (sales) {
    for (const sale of sales) {
      const total = Number(sale.total) || 0;
      const profit = Number(sale.profit) || 0;
      salesStats.totalSales += total;
      salesStats.totalProfit += profit;
      if (sale.sale_date === today) {
        salesStats.todaySales += total;
        salesStats.todayProfit += profit;
      }
    }
  }

  const { data: todayExpenses } = await supabase
    .from("expenses")
    .select("amount")
    .in("business_id", bizIds)
    .eq("expense_date", today);

  if (todayExpenses) {
    salesStats.todayExpenses = todayExpenses.reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0,
    );
  }

  const { count: clientCountResult } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .in("business_id", bizIds)
    .eq("is_walk_in", false);

  const { count: productCountResult } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .in("business_id", bizIds);

  const { data: inventoryProducts } = await supabase
    .from("products")
    .select("base_price, stock_quantity")
    .in("business_id", bizIds)
    .eq("item_type", "product");

  if (inventoryProducts) {
    inventoryStats.inventoryValue = inventoryProducts.reduce(
      (sum, product) =>
        sum + (Number(product.base_price) || 0) * (Number(product.stock_quantity) || 0),
      0,
    );
  }

  const { count: quotationCountResult } = await supabase
    .from("quotations")
    .select("id", { count: "exact", head: true })
    .in("business_id", bizIds);

  return {
    invoiceStats: stats,
    salesStats,
    inventoryStats,
    clientCount: clientCountResult || 0,
    productCount: productCountResult || 0,
    quotationCount: quotationCountResult || 0,
  };
};

export const useDashboardStats = (userId: string | undefined, businessId?: string | null) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: [...DASHBOARD_STATS_QUERY_KEY, userId ?? "anon", businessId ?? "all"],
    queryFn: () => fetchDashboardStats(userId, businessId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  return {
    invoiceStats: data?.invoiceStats ?? defaultStats,
    salesStats: data?.salesStats ?? defaultSalesStats,
    inventoryStats: data?.inventoryStats ?? defaultInventoryStats,
    clientCount: data?.clientCount ?? 0,
    productCount: data?.productCount ?? 0,
    quotationCount: data?.quotationCount ?? 0,
    loading: isLoading,
    refetch,
  };
};
