export type ProductSalesReportRow = {
  product_id: string | null;
  product_name: string;
  sku: string | null;
  units_sold: number;
  revenue: number;
  cogs: number;
  profit: number;
  sale_count: number;
  is_orphan_line: boolean;
};

export type ProductSalesSortKey = "revenue" | "units" | "profit";

export type ProductSalesReportSummary = {
  totalRevenue: number;
  totalUnits: number;
  productCount: number;
  topProductName: string | null;
};

export const mapProductSalesReportRow = (row: {
  product_id: string | null;
  product_name: string;
  sku: string | null;
  units_sold: number | string;
  revenue: number | string;
  cogs: number | string;
  profit: number | string;
  sale_count: number | string;
  is_orphan_line: boolean;
}): ProductSalesReportRow => ({
  product_id: row.product_id,
  product_name: row.product_name,
  sku: row.sku,
  units_sold: Number(row.units_sold) || 0,
  revenue: Number(row.revenue) || 0,
  cogs: Number(row.cogs) || 0,
  profit: Number(row.profit) || 0,
  sale_count: Number(row.sale_count) || 0,
  is_orphan_line: Boolean(row.is_orphan_line),
});

export const buildProductSalesSummary = (
  rows: ProductSalesReportRow[],
): ProductSalesReportSummary => {
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalUnits = rows.reduce((sum, row) => sum + row.units_sold, 0);

  return {
    totalRevenue,
    totalUnits,
    productCount: rows.length,
    topProductName: rows[0]?.product_name ?? null,
  };
};

export const sortProductSalesRows = (
  rows: ProductSalesReportRow[],
  sortBy: ProductSalesSortKey,
): ProductSalesReportRow[] => {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    if (sortBy === "units") return b.units_sold - a.units_sold;
    if (sortBy === "profit") return b.profit - a.profit;
    return b.revenue - a.revenue;
  });

  return sorted;
};

export const filterProductSalesRows = (
  rows: ProductSalesReportRow[],
  search: string,
): ProductSalesReportRow[] => {
  const term = search.trim().toLowerCase();
  if (!term) return rows;

  return rows.filter((row) => {
    const name = row.product_name.toLowerCase();
    const sku = row.sku?.toLowerCase() ?? "";
    return name.includes(term) || sku.includes(term);
  });
};

export const getRevenueSharePercent = (revenue: number, totalRevenue: number): number => {
  if (totalRevenue <= 0) return 0;
  return (revenue / totalRevenue) * 100;
};
