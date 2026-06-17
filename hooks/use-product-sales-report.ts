"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  buildProductSalesSummary,
  mapProductSalesReportRow,
  type ProductSalesReportRow,
  type ProductSalesReportSummary,
} from "@/lib/reports/product-sales-report";

export const PRODUCT_SALES_REPORT_QUERY_KEY = ["product-sales-report"] as const;

const fetchProductSalesReport = async (
  businessId: string,
  fromDate?: string | null,
  toDate?: string | null,
): Promise<ProductSalesReportRow[]> => {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_product_sales_performance", {
    p_business_id: businessId,
    p_from_date: fromDate ?? undefined,
    p_to_date: toDate ?? undefined,
  });

  if (error) throw error;

  return (data ?? []).map(mapProductSalesReportRow);
};

export const useProductSalesReport = (
  businessId: string | null | undefined,
  fromDate?: string | null,
  toDate?: string | null,
  enabled = true,
) => {
  const query = useQuery({
    queryKey: [
      ...PRODUCT_SALES_REPORT_QUERY_KEY,
      businessId ?? "none",
      fromDate ?? "",
      toDate ?? "",
    ],
    queryFn: () => fetchProductSalesReport(businessId!, fromDate, toDate),
    enabled: !!businessId && enabled,
    staleTime: 30 * 1000,
  });

  const rows = query.data ?? [];
  const summary: ProductSalesReportSummary = buildProductSalesSummary(rows);

  return {
    rows,
    summary,
    ...query,
  };
};
