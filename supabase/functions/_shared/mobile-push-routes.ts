/**
 * Deep-link paths for Ankaara mobile (Expo Router file paths, no route groups).
 * Keep in sync with `ankaara/src/lib/navigation/*-flow.ts`.
 */
export const mobilePushRoutes = {
  home: () => "/",
  sales: () => "/sales",
  saleDetail: (id: string) => `/sale/${id}`,
  invoices: () => "/invoices",
  invoiceDetail: (id: string) => `/invoice/${id}`,
  quotations: () => "/quotations",
  quotationDetail: (id: string) => `/quotation/${id}`,
  loans: () => "/loans",
  loanDetail: (id: string) => `/loan/${id}`,
  inventory: () => "/inventory",
  productStockHistory: (id: string) => `/product-stock-history/${id}`,
  business: () => "/business",
  subscribe: () => "/subscribe",
} as const;
