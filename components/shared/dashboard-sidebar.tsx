"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible } from "radix-ui";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Plus,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
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
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [invoicesOpen, setInvoicesOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }
    return pathname === path;
  };

  const isInvoicesActive = pathname.startsWith("/dashboard/invoices");
  const showSubmenu = state !== "collapsed";

  useEffect(() => {
    if (isInvoicesActive) setInvoicesOpen(true);
  }, [isInvoicesActive]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-sidebar-border p-4">
        <span className="text-lg font-medium truncate group-data-[collapsible=icon]:hidden">
          Ankara
        </span>
        <SidebarTrigger className="shrink-0 group-data-[collapsible=icon]:-ml-1.5" />
      </SidebarHeader>

      <SidebarContent>
        {/* ── Main ── */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-xs uppercase", !showSubmenu && "sr-only")}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Overview */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Overview">
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Invoices — collapsible */}
              <Collapsible.Root
                open={invoicesOpen}
                onOpenChange={setInvoicesOpen}
                asChild
              >
                <SidebarMenuItem>
                  <Collapsible.Trigger asChild>
                    <SidebarMenuButton
                      isActive={isInvoicesActive}
                      tooltip="Invoices"
                      className={cn(showSubmenu && "cursor-pointer")}
                    >
                      <FileText className="size-4 shrink-0" />
                      <span>Invoices</span>
                      {showSubmenu && (
                        <ChevronRight
                          className={cn(
                            "ml-auto size-4 shrink-0 transition-transform duration-200",
                            invoicesOpen && "rotate-90"
                          )}
                        />
                      )}
                    </SidebarMenuButton>
                  </Collapsible.Trigger>

                  {showSubmenu && (
                    <Collapsible.Content>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive("/dashboard/invoices")}>
                            <Link href="/dashboard/invoices">
                              <FileText className="size-4" />
                              <span>All Invoices</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={isActive("/dashboard/invoices/create")}>
                            <Link href="/dashboard/invoices/create">
                              <Plus className="size-4" />
                              <span>Create Invoice</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/invoices?status=paid"}>
                            <Link href="/dashboard/invoices?status=paid">
                              <CheckCircle2 className="size-4" />
                              <span>Paid</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/invoices?status=sent"}>
                            <Link href="/dashboard/invoices?status=sent">
                              <Send className="size-4" />
                              <span>Sent</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/invoices?status=overdue"}>
                            <Link href="/dashboard/invoices?status=overdue">
                              <AlertTriangle className="size-4" />
                              <span>Overdue</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/invoices?status=draft"}>
                            <Link href="/dashboard/invoices?status=draft">
                              <Clock className="size-4" />
                              <span>Drafts</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </Collapsible.Content>
                  )}
                </SidebarMenuItem>
              </Collapsible.Root>

              {/* Clients */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/clients")} tooltip="Clients">
                  <Link href="/dashboard/clients">
                    <Users className="size-4" />
                    <span>Clients</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Account ── */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-xs uppercase", !showSubmenu && "sr-only")}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")} tooltip="Settings">
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/50 text-center">Ankara</p>
      </SidebarFooter>
    </Sidebar>
  );
};
