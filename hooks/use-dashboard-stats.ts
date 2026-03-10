"use client";

import { useState, useEffect, useCallback } from "react";
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

export const useDashboardStats = (userId: string | undefined) => {
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>(defaultStats);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, currency")
      .eq("owner_id", userId);

    if (!businesses || businesses.length === 0) {
      setLoading(false);
      return;
    }

    const bizIds = businesses.map((b: { id: string }) => b.id);
    const currency = businesses[0]?.currency || "TZS";

    const { data: invoices } = await supabase
      .from("invoices")
      .select("status, total")
      .in("organization_id", bizIds);

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
    setInvoiceStats(stats);

    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .in("organization_id", bizIds);

    setClientCount(count || 0);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { invoiceStats, clientCount, loading, refetch: fetchStats };
};
