"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/constants/values";
import { usePathname, useSearchParams } from "next/navigation";
import { Collapsible } from "radix-ui";
import {
  LayoutDashboard,
  FileText,
  Quote,
  Users,
  Package,
  Plus,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Palette,
  Eye,
  XCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [quotationsOpen, setQuotationsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }
    return pathname === path;
  };

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
        <span className={cn("font-semibold", state === "collapsed" && "hidden")}>Dashboard</span>
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

              {/* Invoices — collapsible when expanded, dropdown when collapsed */}
              {showSubmenu ? (
                <Collapsible.Root open={invoicesOpen} onOpenChange={setInvoicesOpen} asChild>
                  <SidebarMenuItem>
                    <Collapsible.Trigger asChild>
                      <SidebarMenuButton
                        isActive={isInvoicesActive}
                        tooltip="Invoices"
                        className="cursor-pointer"
                      >
                        <FileText className="size-4 shrink-0" />
                        <span>Invoices</span>
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
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/invoices" && !searchParams.get("status")
                            }
                          >
                            <Link href="/dashboard/invoices">
                              <FileText className="size-4" />
                              <span>All Invoices</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive("/dashboard/invoices/create")}
                          >
                            <Link href="/dashboard/invoices/create">
                              <Plus className="size-4" />
                              <span>Create Invoice</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/invoices" &&
                              searchParams.get("status") === "draft"
                            }
                          >
                            <Link href="/dashboard/invoices?status=draft">
                              <Clock className="size-4" />
                              <span>Drafts</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/invoices" &&
                              searchParams.get("status") === "sent"
                            }
                          >
                            <Link href="/dashboard/invoices?status=sent">
                              <Send className="size-4" />
                              <span>Sent</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/invoices" &&
                              searchParams.get("status") === "paid"
                            }
                          >
                            <Link href="/dashboard/invoices?status=paid">
                              <CheckCircle2 className="size-4" />
                              <span>Paid</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/invoices" &&
                              searchParams.get("status") === "overdue"
                            }
                          >
                            <Link href="/dashboard/invoices?status=overdue">
                              <AlertTriangle className="size-4" />
                              <span>Overdue</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </Collapsible.Content>
                  </SidebarMenuItem>
                </Collapsible.Root>
              ) : (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton isActive={isInvoicesActive} tooltip="Invoices">
                        <FileText className="size-4 shrink-0" />
                        <span>Invoices</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="min-w-44">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/invoices" className="flex items-center gap-2">
                          <FileText className="size-4" />
                          All Invoices
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/invoices/create" className="flex items-center gap-2">
                          <Plus className="size-4" />
                          Create Invoice
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/invoices?status=draft"
                          className="flex items-center gap-2"
                        >
                          <Clock className="size-4" />
                          Drafts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/invoices?status=sent"
                          className="flex items-center gap-2"
                        >
                          <Send className="size-4" />
                          Sent
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/invoices?status=paid"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4" />
                          Paid
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/invoices?status=overdue"
                          className="flex items-center gap-2"
                        >
                          <AlertTriangle className="size-4" />
                          Overdue
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              )}

              {/* Quotations — collapsible when expanded, dropdown when collapsed */}
              {showSubmenu ? (
                <Collapsible.Root open={quotationsOpen} onOpenChange={setQuotationsOpen} asChild>
                  <SidebarMenuItem>
                    <Collapsible.Trigger asChild>
                      <SidebarMenuButton
                        isActive={isQuotationsActive}
                        tooltip="Quotations"
                        className="cursor-pointer"
                      >
                        <Quote className="size-4 shrink-0" />
                        <span>Quotations</span>
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
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" && !searchParams.get("status")
                            }
                          >
                            <Link href="/dashboard/quotations">
                              <Quote className="size-4" />
                              <span>All Quotations</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive("/dashboard/quotations/create")}
                          >
                            <Link href="/dashboard/quotations/create">
                              <Plus className="size-4" />
                              <span>Create Quotation</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "draft"
                            }
                          >
                            <Link href="/dashboard/quotations?status=draft">
                              <Clock className="size-4" />
                              <span>Drafts</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "sent"
                            }
                          >
                            <Link href="/dashboard/quotations?status=sent">
                              <Send className="size-4" />
                              <span>Sent</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "viewed"
                            }
                          >
                            <Link href="/dashboard/quotations?status=viewed">
                              <Eye className="size-4" />
                              <span>Viewed</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "accepted"
                            }
                          >
                            <Link href="/dashboard/quotations?status=accepted">
                              <CheckCircle2 className="size-4" />
                              <span>Accepted</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "expired"
                            }
                          >
                            <Link href="/dashboard/quotations?status=expired">
                              <AlertTriangle className="size-4" />
                              <span>Expired</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              pathname === "/dashboard/quotations" &&
                              searchParams.get("status") === "cancelled"
                            }
                          >
                            <Link href="/dashboard/quotations?status=cancelled">
                              <XCircle className="size-4" />
                              <span>Cancelled</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </Collapsible.Content>
                  </SidebarMenuItem>
                </Collapsible.Root>
              ) : (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton isActive={isQuotationsActive} tooltip="Quotations">
                        <Quote className="size-4 shrink-0" />
                        <span>Quotations</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="min-w-44">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/quotations" className="flex items-center gap-2">
                          <Quote className="size-4" />
                          All Quotations
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/quotations/create" className="flex items-center gap-2">
                          <Plus className="size-4" />
                          Create Quotation
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=draft"
                          className="flex items-center gap-2"
                        >
                          <Clock className="size-4" />
                          Drafts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=sent"
                          className="flex items-center gap-2"
                        >
                          <Send className="size-4" />
                          Sent
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=viewed"
                          className="flex items-center gap-2"
                        >
                          <Eye className="size-4" />
                          Viewed
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=accepted"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4" />
                          Accepted
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=expired"
                          className="flex items-center gap-2"
                        >
                          <AlertTriangle className="size-4" />
                          Expired
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/quotations?status=cancelled"
                          className="flex items-center gap-2"
                        >
                          <XCircle className="size-4" />
                          Cancelled
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              )}

              {/* Clients */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/clients")}
                  tooltip="Clients"
                >
                  <Link href="/dashboard/clients">
                    <Users className="size-4" />
                    <span>Clients</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Products */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/products")}
                  tooltip="Products & Services"
                >
                  <Link href="/dashboard/products">
                    <Package className="size-4" />
                    <span>Products</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Invoice Templates */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings/templates")}
                  tooltip="Invoice Templates"
                >
                  <Link href="/dashboard/settings/templates">
                    <Palette className="size-4" />
                    <span>Invoice Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* <SidebarSeparator /> */}

        {/* ── Account ── */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-xs uppercase", !showSubmenu && "sr-only")}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings/profile")}
                  tooltip="Profile"
                >
                  <Link href="/dashboard/settings/profile">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/settings/businesses")}
                  tooltip="Businesses"
                >
                  <Link href="/dashboard/settings/businesses">
                    <Building2 className="size-4" />
                    <span>Businesses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-sidebar-foreground/50 text-center text-xs">
          Copyright © {new Date().getFullYear()} All rights reserved.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
};
