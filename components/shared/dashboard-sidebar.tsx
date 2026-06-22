"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Collapsible } from "radix-ui";
import { FileText, ChevronRight, Quote, Palette } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReportsIcon } from "@/components/icons/reports-icon";
import { useTranslation } from "@/hooks/use-translation";
import {
  DASHBOARD_SIDEBAR_ACCOUNT_ITEMS,
  DASHBOARD_SIDEBAR_INVOICE_SUB_ITEMS,
  DASHBOARD_SIDEBAR_MAIN_ITEMS,
  DASHBOARD_SIDEBAR_QUOTATION_SUB_ITEMS,
  type DashboardNavItem,
} from "@/lib/i18n/dashboard-nav-config";
import { DASHBOARD_ROUTE_PERMISSIONS } from "@/lib/staff-permissions";
import { useStaffPermissions } from "@/hooks/use-staff-permissions";

const renderSubMenuItems = (
  items: DashboardNavItem[],
  pathname: string,
  status: string | null,
  t: (key: string) => string,
) =>
  items.map((item) => (
    <SidebarMenuSubItem key={item.href}>
      <SidebarMenuSubButton asChild isActive={item.isActive(pathname, status)}>
        <Link href={item.href}>
          <item.Icon className="size-4" />
          <span>{t(item.labelKey)}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  ));

const renderDropdownItems = (
  items: DashboardNavItem[],
  t: (key: string) => string,
) =>
  items.map((item) => (
    <DropdownMenuItem key={item.href} asChild>
      <Link href={item.href} className="flex items-center gap-2">
        <item.Icon className="size-4" />
        {t(item.labelKey)}
      </Link>
    </DropdownMenuItem>
  ));

const OWNER_ONLY_ACCOUNT_HREFS = new Set(["/dashboard/settings/profile"]);

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const { t } = useTranslation();
  const permissions = useStaffPermissions();
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [quotationsOpen, setQuotationsOpen] = useState(false);

  const canShowHref = (href: string) => {
    const gate = DASHBOARD_ROUTE_PERMISSIONS[href];
    if (!gate) return true;
    return permissions.can(gate.resource, gate.action as never);
  };

  const mainItems = DASHBOARD_SIDEBAR_MAIN_ITEMS.filter((item) => canShowHref(item.href));
  const accountItems = DASHBOARD_SIDEBAR_ACCOUNT_ITEMS.filter((item) => {
    if (OWNER_ONLY_ACCOUNT_HREFS.has(item.href) && !permissions.isOwner) return false;
    return canShowHref(item.href);
  });
  const invoiceItems = DASHBOARD_SIDEBAR_INVOICE_SUB_ITEMS.filter((item) => canShowHref(item.href));
  const quotationItems = DASHBOARD_SIDEBAR_QUOTATION_SUB_ITEMS.filter((item) =>
    canShowHref(item.href),
  );
  const showInvoices = invoiceItems.length > 0 && permissions.can("invoices", "view");
  const showQuotations = quotationItems.length > 0 && permissions.can("quotations", "view");
  const showTemplates = permissions.can("invoices", "view");

  const status = searchParams.get("status");
  const isInvoicesActive = pathname.startsWith("/dashboard/invoices");
  const isQuotationsActive = pathname.startsWith("/dashboard/quotations");
  const showSubmenu = state !== "collapsed";

  useEffect(() => {
    if (isInvoicesActive) setInvoicesOpen(true);
  }, [isInvoicesActive]);

  useEffect(() => {
    if (isQuotationsActive) setQuotationsOpen(true);
  }, [isQuotationsActive]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="border-sidebar-border flex flex-row items-center justify-between border-b p-4">
        <span className={cn("font-semibold", state === "collapsed" && "hidden")}>
          {t("dashboard.nav.title")}
        </span>
        <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:-ml-1.5" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-xs uppercase", !showSubmenu && "sr-only")}>
            {t("dashboard.nav.groupMain")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const Icon =
                  item.labelKey === "dashboard.nav.reports" ? ReportsIcon : item.Icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive(pathname, status)}
                      tooltip={t(item.labelKey)}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {showInvoices ? (
                showSubmenu ? (
                  <Collapsible.Root open={invoicesOpen} onOpenChange={setInvoicesOpen} asChild>
                    <SidebarMenuItem>
                      <Collapsible.Trigger asChild>
                        <SidebarMenuButton
                          isActive={isInvoicesActive}
                          tooltip={t("dashboard.nav.invoices")}
                          className="cursor-pointer"
                        >
                          <FileText className="size-4 shrink-0" />
                          <span>{t("dashboard.nav.invoices")}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto size-4 shrink-0 transition-transform duration-200",
                              invoicesOpen && "rotate-90",
                            )}
                          />
                        </SidebarMenuButton>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <SidebarMenuSub>
                          {renderSubMenuItems(invoiceItems, pathname, status, t)}
                        </SidebarMenuSub>
                      </Collapsible.Content>
                    </SidebarMenuItem>
                  </Collapsible.Root>
                ) : (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          isActive={isInvoicesActive}
                          tooltip={t("dashboard.nav.invoices")}
                        >
                          <FileText className="size-4 shrink-0" />
                          <span>{t("dashboard.nav.invoices")}</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="min-w-44">
                        {renderDropdownItems(invoiceItems, t)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                )
              ) : null}

              {showQuotations ? (
                showSubmenu ? (
                  <Collapsible.Root open={quotationsOpen} onOpenChange={setQuotationsOpen} asChild>
                    <SidebarMenuItem>
                      <Collapsible.Trigger asChild>
                        <SidebarMenuButton
                          isActive={isQuotationsActive}
                          tooltip={t("dashboard.nav.quotations")}
                          className="cursor-pointer"
                        >
                          <Quote className="size-4 shrink-0" />
                          <span>{t("dashboard.nav.quotations")}</span>
                          <ChevronRight
                            className={cn(
                              "ml-auto size-4 shrink-0 transition-transform duration-200",
                              quotationsOpen && "rotate-90",
                            )}
                          />
                        </SidebarMenuButton>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <SidebarMenuSub>
                          {renderSubMenuItems(quotationItems, pathname, status, t)}
                        </SidebarMenuSub>
                      </Collapsible.Content>
                    </SidebarMenuItem>
                  </Collapsible.Root>
                ) : (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          isActive={isQuotationsActive}
                          tooltip={t("dashboard.nav.quotations")}
                        >
                          <Quote className="size-4 shrink-0" />
                          <span>{t("dashboard.nav.quotations")}</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="min-w-44">
                        {renderDropdownItems(quotationItems, t)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                )
              ) : null}

              {showTemplates ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/settings/templates"}
                    tooltip={t("dashboard.nav.invoiceTemplates")}
                  >
                    <Link href="/dashboard/settings/templates">
                      <Palette className="size-4" />
                      <span>{t("dashboard.nav.invoiceTemplates")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-xs uppercase", !showSubmenu && "sr-only")}>
            {t("dashboard.nav.groupAccount")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive(pathname, status)}
                    tooltip={t(item.labelKey)}
                  >
                    <Link href={item.href}>
                      <item.Icon className="size-4" />
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-sidebar-foreground/50 text-center text-xs">{t("footer.copyright")}</p>
      </SidebarFooter>
    </Sidebar>
  );
};
