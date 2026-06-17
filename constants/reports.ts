export const REPORTS_SCREEN = {
  title: "Reports",
  subtitle: "Insights into how your business is performing.",
  businessSubtitle: (name: string) => `Reports for ${name}`,
} as const;

export const REPORTS_EMPTY_NO_BUSINESS = {
  title: "No business yet",
  description: "Create a business first to view performance reports.",
  actionLabel: "Go to Businesses",
  actionHref: "/dashboard/settings/businesses",
} as const;

export const REPORTS_UPGRADE_REQUIRED = {
  title: "Upgrade to view reports",
  description:
    "Product sales performance reports are available on Pro and Business plans.",
  actionLabel: "View plans",
} as const;

export const PRODUCT_SALES_REPORT = {
  title: "Product Sales Performance",
  description: "See which products sold best in the selected period.",
  businessSubtitle: (name: string) => `Product performance for ${name}`,
  emptyTitle: "No product sales in this period",
  emptyDescription: "Record sales with products to see performance rankings here.",
  searchPlaceholder: "Search products…",
  sort: {
    revenue: "Revenue",
    units: "Units",
    profit: "Profit",
  },
  sortByLabel: "Sort by",
  period: {
    last7Days: "Last 7 days",
    thisMonth: "This month",
    allTime: "All time",
  },
  timeline: {
    customRange: "Custom date range",
  },
  columns: {
    rank: "#",
    product: "Product",
    units: "Units",
    revenue: "Revenue",
    profit: "Profit",
    share: "Share",
  },
  summary: {
    totalRevenue: "Total revenue",
    totalUnits: "Units sold",
    productsSold: "Products sold",
    topProduct: "Top product",
  },
  deletedProductHint: "From deleted inventory item",
} as const;

export const REPORT_HUB_ITEMS = [
  {
    slug: "product-sales",
    title: PRODUCT_SALES_REPORT.title,
    description: PRODUCT_SALES_REPORT.description,
    href: "/dashboard/reports/product-sales",
  },
] as const;
