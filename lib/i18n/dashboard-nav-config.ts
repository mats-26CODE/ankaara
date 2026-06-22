import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  ChartColumnIncreasing,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  Palette,
  Plus,
  Quote,
  Send,
  ShoppingCart,
  User,
  Users,
  UserCog,
  Wallet,
  XCircle,
} from "lucide-react";

export type DashboardNavMatcher = (pathname: string, status: string | null) => boolean;

export interface DashboardNavItem {
  labelKey: string;
  href: string;
  Icon: LucideIcon;
  isActive: DashboardNavMatcher;
}

export interface DashboardNavGroup {
  labelKey: string;
  items: DashboardNavItem[];
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    labelKey: "dashboard.nav.groupMain",
    items: [
      {
        labelKey: "dashboard.nav.overview",
        href: "/dashboard",
        Icon: LayoutDashboard,
        isActive: (pathname) => pathname === "/dashboard" || pathname === "/dashboard/",
      },
      {
        labelKey: "dashboard.nav.sales",
        href: "/dashboard/sales",
        Icon: ShoppingCart,
        isActive: (pathname) => pathname.startsWith("/dashboard/sales"),
      },
      {
        labelKey: "dashboard.nav.profits",
        href: "/dashboard/profits",
        Icon: ChartColumnIncreasing,
        isActive: (pathname) => pathname.startsWith("/dashboard/profits"),
      },
      {
        labelKey: "dashboard.nav.inventory",
        href: "/dashboard/products",
        Icon: Package,
        isActive: (pathname) => pathname.startsWith("/dashboard/products"),
      },
      {
        labelKey: "dashboard.nav.clients",
        href: "/dashboard/clients",
        Icon: Users,
        isActive: (pathname) => pathname.startsWith("/dashboard/clients"),
      },
      {
        labelKey: "dashboard.nav.loans",
        href: "/dashboard/loans",
        Icon: HandCoins,
        isActive: (pathname) => pathname.startsWith("/dashboard/loans"),
      },
      {
        labelKey: "dashboard.nav.expenses",
        href: "/dashboard/expenses",
        Icon: Wallet,
        isActive: (pathname) => pathname.startsWith("/dashboard/expenses"),
      },
      {
        labelKey: "dashboard.nav.invoiceTemplates",
        href: "/dashboard/settings/templates",
        Icon: Palette,
        isActive: (pathname) => pathname === "/dashboard/settings/templates",
      },
    ],
  },
  {
    labelKey: "dashboard.nav.groupInvoices",
    items: [
      {
        labelKey: "dashboard.nav.allInvoices",
        href: "/dashboard/invoices",
        Icon: FileText,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && !status,
      },
      {
        labelKey: "dashboard.nav.createInvoice",
        href: "/dashboard/invoices/create",
        Icon: Plus,
        isActive: (pathname) => pathname === "/dashboard/invoices/create",
      },
      {
        labelKey: "dashboard.status.draft",
        href: "/dashboard/invoices?status=draft",
        Icon: Clock,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "draft",
      },
      {
        labelKey: "dashboard.status.sent",
        href: "/dashboard/invoices?status=sent",
        Icon: Send,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "sent",
      },
      {
        labelKey: "dashboard.status.viewed",
        href: "/dashboard/invoices?status=viewed",
        Icon: Eye,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "viewed",
      },
      {
        labelKey: "dashboard.status.paid",
        href: "/dashboard/invoices?status=paid",
        Icon: CheckCircle2,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "paid",
      },
      {
        labelKey: "dashboard.status.overdue",
        href: "/dashboard/invoices?status=overdue",
        Icon: AlertTriangle,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "overdue",
      },
    ],
  },
  {
    labelKey: "dashboard.nav.groupQuotations",
    items: [
      {
        labelKey: "dashboard.nav.allQuotations",
        href: "/dashboard/quotations",
        Icon: Quote,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && !status,
      },
      {
        labelKey: "dashboard.nav.createQuotation",
        href: "/dashboard/quotations/create",
        Icon: Plus,
        isActive: (pathname) => pathname === "/dashboard/quotations/create",
      },
      {
        labelKey: "dashboard.status.draft",
        href: "/dashboard/quotations?status=draft",
        Icon: Clock,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "draft",
      },
      {
        labelKey: "dashboard.status.sent",
        href: "/dashboard/quotations?status=sent",
        Icon: Send,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "sent",
      },
      {
        labelKey: "dashboard.status.viewed",
        href: "/dashboard/quotations?status=viewed",
        Icon: Eye,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "viewed",
      },
      {
        labelKey: "dashboard.status.accepted",
        href: "/dashboard/quotations?status=accepted",
        Icon: CheckCircle2,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "accepted",
      },
      {
        labelKey: "dashboard.status.expired",
        href: "/dashboard/quotations?status=expired",
        Icon: AlertTriangle,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "expired",
      },
      {
        labelKey: "dashboard.status.cancelled",
        href: "/dashboard/quotations?status=cancelled",
        Icon: XCircle,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "cancelled",
      },
    ],
  },
  {
    labelKey: "dashboard.nav.groupAccount",
    items: [
      {
        labelKey: "dashboard.nav.profile",
        href: "/dashboard/settings/profile",
        Icon: User,
        isActive: (pathname) => pathname === "/dashboard/settings/profile",
      },
      {
        labelKey: "dashboard.nav.businesses",
        href: "/dashboard/settings/businesses",
        Icon: Building2,
        isActive: (pathname) => pathname === "/dashboard/settings/businesses",
      },
    ],
  },
];

/** Sidebar-only flat nav (includes reports + collapsible invoice/quotation submenus). */
export const DASHBOARD_SIDEBAR_MAIN_ITEMS: DashboardNavItem[] = [
  {
    labelKey: "dashboard.nav.overview",
    href: "/dashboard",
    Icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard" || pathname === "/dashboard/",
  },
  {
    labelKey: "dashboard.nav.sales",
    href: "/dashboard/sales",
    Icon: ShoppingCart,
    isActive: (pathname) => pathname.startsWith("/dashboard/sales"),
  },
  {
    labelKey: "dashboard.nav.profits",
    href: "/dashboard/profits",
    Icon: ChartColumnIncreasing,
    isActive: (pathname) => pathname.startsWith("/dashboard/profits"),
  },
  {
    labelKey: "dashboard.nav.reports",
    href: "/dashboard/reports",
    Icon: ChartColumnIncreasing,
    isActive: (pathname) => pathname.startsWith("/dashboard/reports"),
  },
  {
    labelKey: "dashboard.nav.inventory",
    href: "/dashboard/products",
    Icon: Package,
    isActive: (pathname) => pathname === "/dashboard/products",
  },
  {
    labelKey: "dashboard.nav.clients",
    href: "/dashboard/clients",
    Icon: Users,
    isActive: (pathname) => pathname === "/dashboard/clients",
  },
  {
    labelKey: "dashboard.nav.loans",
    href: "/dashboard/loans",
    Icon: HandCoins,
    isActive: (pathname) => pathname.startsWith("/dashboard/loans"),
  },
  {
    labelKey: "dashboard.nav.expenses",
    href: "/dashboard/expenses",
    Icon: Wallet,
    isActive: (pathname) => pathname.startsWith("/dashboard/expenses"),
  },
  {
    labelKey: "dashboard.nav.staff",
    href: "/dashboard/staff",
    Icon: UserCog,
    isActive: (pathname) => pathname.startsWith("/dashboard/staff"),
  },
];

export const DASHBOARD_SIDEBAR_INVOICE_SUB_ITEMS: DashboardNavItem[] = [
  {
    labelKey: "dashboard.nav.allInvoices",
    href: "/dashboard/invoices",
    Icon: FileText,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && !status,
  },
  {
    labelKey: "dashboard.nav.createInvoice",
    href: "/dashboard/invoices/create",
    Icon: Plus,
    isActive: (pathname) => pathname === "/dashboard/invoices/create",
  },
  {
    labelKey: "dashboard.status.draft",
    href: "/dashboard/invoices?status=draft",
    Icon: Clock,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "draft",
  },
  {
    labelKey: "dashboard.status.sent",
    href: "/dashboard/invoices?status=sent",
    Icon: Send,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "sent",
  },
  {
    labelKey: "dashboard.status.viewed",
    href: "/dashboard/invoices?status=viewed",
    Icon: Eye,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "viewed",
  },
  {
    labelKey: "dashboard.status.paid",
    href: "/dashboard/invoices?status=paid",
    Icon: CheckCircle2,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "paid",
  },
  {
    labelKey: "dashboard.status.overdue",
    href: "/dashboard/invoices?status=overdue",
    Icon: AlertTriangle,
    isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "overdue",
  },
];

export const DASHBOARD_SIDEBAR_QUOTATION_SUB_ITEMS: DashboardNavItem[] = [
  {
    labelKey: "dashboard.nav.allQuotations",
    href: "/dashboard/quotations",
    Icon: Quote,
    isActive: (pathname, status) => pathname === "/dashboard/quotations" && !status,
  },
  {
    labelKey: "dashboard.nav.createQuotation",
    href: "/dashboard/quotations/create",
    Icon: Plus,
    isActive: (pathname) => pathname === "/dashboard/quotations/create",
  },
  {
    labelKey: "dashboard.status.draft",
    href: "/dashboard/quotations?status=draft",
    Icon: Clock,
    isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "draft",
  },
  {
    labelKey: "dashboard.status.sent",
    href: "/dashboard/quotations?status=sent",
    Icon: Send,
    isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "sent",
  },
  {
    labelKey: "dashboard.status.viewed",
    href: "/dashboard/quotations?status=viewed",
    Icon: Eye,
    isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "viewed",
  },
  {
    labelKey: "dashboard.status.accepted",
    href: "/dashboard/quotations?status=accepted",
    Icon: CheckCircle2,
    isActive: (pathname, status) =>
      pathname === "/dashboard/quotations" && status === "accepted",
  },
  {
    labelKey: "dashboard.status.expired",
    href: "/dashboard/quotations?status=expired",
    Icon: AlertTriangle,
    isActive: (pathname, status) =>
      pathname === "/dashboard/quotations" && status === "expired",
  },
  {
    labelKey: "dashboard.status.cancelled",
    href: "/dashboard/quotations?status=cancelled",
    Icon: XCircle,
    isActive: (pathname, status) =>
      pathname === "/dashboard/quotations" && status === "cancelled",
  },
];

export const DASHBOARD_SIDEBAR_ACCOUNT_ITEMS: DashboardNavItem[] = [
  {
    labelKey: "dashboard.nav.profile",
    href: "/dashboard/settings/profile",
    Icon: User,
    isActive: (pathname) => pathname === "/dashboard/settings/profile",
  },
  {
    labelKey: "dashboard.nav.businesses",
    href: "/dashboard/settings/businesses",
    Icon: Building2,
    isActive: (pathname) => pathname === "/dashboard/settings/businesses",
  },
];
