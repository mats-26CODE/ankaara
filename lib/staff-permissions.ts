import type { Json } from "@/database.types";

export const STAFF_PERMISSION_RESOURCES = [
  "dashboard",
  "profits",
  "reports",
  "sales",
  "inventory",
  "clients",
  "expenses",
  "loans",
  "invoices",
  "quotations",
  "business_settings",
  "staff_management",
] as const;

export type StaffPermissionResource = (typeof STAFF_PERMISSION_RESOURCES)[number];

export type StaffPermissionActions = {
  dashboard: "view";
  profits: "view";
  reports: "view";
  sales: "view" | "create" | "edit";
  inventory: "view" | "create" | "edit";
  clients: "view" | "create" | "edit";
  expenses: "view" | "create" | "edit";
  loans: "view" | "create" | "edit";
  invoices: "view" | "create" | "edit";
  quotations: "view" | "create" | "edit";
  business_settings: "view" | "edit" | "create";
  staff_management: "view" | "manage";
};

export type StaffPermissionsDocument = {
  [K in StaffPermissionResource]?: Partial<Record<StaffPermissionActions[K], boolean>>;
};

export type ResolvedStaffPermissions = {
  isOwner: boolean;
  can: <R extends StaffPermissionResource>(
    resource: R,
    action: StaffPermissionActions[R],
  ) => boolean;
};

const OWNER_PERMISSIONS: StaffPermissionsDocument = {
  dashboard: { view: true },
  profits: { view: true },
  reports: { view: true },
  sales: { view: true, create: true, edit: true },
  inventory: { view: true, create: true, edit: true },
  clients: { view: true, create: true, edit: true },
  expenses: { view: true, create: true, edit: true },
  loans: { view: true, create: true, edit: true },
  invoices: { view: true, create: true, edit: true },
  quotations: { view: true, create: true, edit: true },
  business_settings: { view: true, edit: true, create: true },
  staff_management: { view: true, manage: true },
};

export const parseStaffPermissions = (
  raw: Json | StaffPermissionsDocument | null | undefined,
): StaffPermissionsDocument => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as StaffPermissionsDocument;
};

export const resolveStaffPermissions = (
  isOwner: boolean,
  permissions: StaffPermissionsDocument | null | undefined,
): ResolvedStaffPermissions => {
  const source = isOwner ? OWNER_PERMISSIONS : (permissions ?? {});

  return {
    isOwner,
    can: (resource, action) => {
      const bucket = source[resource] as Record<string, boolean | undefined> | undefined;
      if (!bucket) return false;
      return Boolean(bucket[action as string]);
    },
  };
};

export const DASHBOARD_ROUTE_PERMISSIONS: Partial<
  Record<string, { resource: StaffPermissionResource; action: StaffPermissionActions[StaffPermissionResource] }>
> = {
  // Overview (/dashboard) is always reachable; dashboard.view gates widgets on the page.
  "/dashboard/sales": { resource: "sales", action: "view" },
  "/dashboard/profits": { resource: "profits", action: "view" },
  "/dashboard/reports": { resource: "reports", action: "view" },
  "/dashboard/products": { resource: "inventory", action: "view" },
  "/dashboard/clients": { resource: "clients", action: "view" },
  "/dashboard/loans": { resource: "loans", action: "view" },
  "/dashboard/expenses": { resource: "expenses", action: "view" },
  "/dashboard/invoices": { resource: "invoices", action: "view" },
  "/dashboard/quotations": { resource: "quotations", action: "view" },
  "/dashboard/settings/templates": { resource: "invoices", action: "view" },
  "/dashboard/settings/businesses": { resource: "business_settings", action: "view" },
  "/dashboard/staff": { resource: "staff_management", action: "view" },
};
