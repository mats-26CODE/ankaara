"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser, useLogout } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { useLanguage, translations } from "@/lib/stores/preferences-store";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Palette,
  Plus,
  Quote,
  Send,
  ShoppingCart,
  Sun,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import Logo from "./logo";
import { useTheme } from "@/lib/stores/preferences-store";
import { ProfileAvatar } from "./profile-avatar";
import { cn } from "@/lib/utils";
import { resolveProfileDisplayName, resolveProfileFirstName } from "@/lib/profile-display-name";

type DashboardNavMatcher = (pathname: string, status: string | null) => boolean;

interface DashboardNavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
  isActive: DashboardNavMatcher;
}

interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

const DASHBOARD_MOBILE_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        Icon: LayoutDashboard,
        isActive: (pathname) => pathname === "/dashboard" || pathname === "/dashboard/",
      },
      {
        label: "Sales",
        href: "/dashboard/sales",
        Icon: ShoppingCart,
        isActive: (pathname) => pathname.startsWith("/dashboard/sales"),
      },
      {
        label: "Profits",
        href: "/dashboard/profits",
        Icon: ChartColumnIncreasing,
        isActive: (pathname) => pathname.startsWith("/dashboard/profits"),
      },
      {
        label: "Inventory",
        href: "/dashboard/products",
        Icon: Package,
        isActive: (pathname) => pathname.startsWith("/dashboard/products"),
      },
      {
        label: "Clients",
        href: "/dashboard/clients",
        Icon: Users,
        isActive: (pathname) => pathname.startsWith("/dashboard/clients"),
      },
      {
        label: "Loans",
        href: "/dashboard/loans",
        Icon: HandCoins,
        isActive: (pathname) => pathname.startsWith("/dashboard/loans"),
      },
      {
        label: "Expenses",
        href: "/dashboard/expenses",
        Icon: Wallet,
        isActive: (pathname) => pathname.startsWith("/dashboard/expenses"),
      },
      {
        label: "Invoice Templates",
        href: "/dashboard/settings/templates",
        Icon: Palette,
        isActive: (pathname) => pathname === "/dashboard/settings/templates",
      },
    ],
  },
  {
    label: "Invoices",
    items: [
      {
        label: "All Invoices",
        href: "/dashboard/invoices",
        Icon: FileText,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && !status,
      },
      {
        label: "Create Invoice",
        href: "/dashboard/invoices/create",
        Icon: Plus,
        isActive: (pathname) => pathname === "/dashboard/invoices/create",
      },
      {
        label: "Drafts",
        href: "/dashboard/invoices?status=draft",
        Icon: Clock,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "draft",
      },
      {
        label: "Sent",
        href: "/dashboard/invoices?status=sent",
        Icon: Send,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "sent",
      },
      {
        label: "Paid",
        href: "/dashboard/invoices?status=paid",
        Icon: CheckCircle2,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "paid",
      },
      {
        label: "Overdue",
        href: "/dashboard/invoices?status=overdue",
        Icon: AlertTriangle,
        isActive: (pathname, status) => pathname === "/dashboard/invoices" && status === "overdue",
      },
    ],
  },
  {
    label: "Quotations",
    items: [
      {
        label: "All Quotations",
        href: "/dashboard/quotations",
        Icon: Quote,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && !status,
      },
      {
        label: "Create Quotation",
        href: "/dashboard/quotations/create",
        Icon: Plus,
        isActive: (pathname) => pathname === "/dashboard/quotations/create",
      },
      {
        label: "Drafts",
        href: "/dashboard/quotations?status=draft",
        Icon: Clock,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "draft",
      },
      {
        label: "Sent",
        href: "/dashboard/quotations?status=sent",
        Icon: Send,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "sent",
      },
      {
        label: "Viewed",
        href: "/dashboard/quotations?status=viewed",
        Icon: Eye,
        isActive: (pathname, status) => pathname === "/dashboard/quotations" && status === "viewed",
      },
      {
        label: "Accepted",
        href: "/dashboard/quotations?status=accepted",
        Icon: CheckCircle2,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "accepted",
      },
      {
        label: "Expired",
        href: "/dashboard/quotations?status=expired",
        Icon: AlertTriangle,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "expired",
      },
      {
        label: "Cancelled",
        href: "/dashboard/quotations?status=cancelled",
        Icon: XCircle,
        isActive: (pathname, status) =>
          pathname === "/dashboard/quotations" && status === "cancelled",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile",
        href: "/dashboard/settings/profile",
        Icon: User,
        isActive: (pathname) => pathname === "/dashboard/settings/profile",
      },
      {
        label: "Businesses",
        href: "/dashboard/settings/businesses",
        Icon: Building2,
        isActive: (pathname) => pathname === "/dashboard/settings/businesses",
      },
    ],
  },
];

const NavBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { profile, refetch: refetchProfile } = useProfile();
  const profileDisplayName = resolveProfileDisplayName(profile, user);
  const profileFirstName = resolveProfileFirstName(profile, user);
  const logout = useLogout();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const status = searchParams.get("status");

  const isLanding =
    pathname === "/" ||
    pathname === "/about-us" ||
    pathname === "/support" ||
    pathname === "/terms" ||
    pathname === "/privacy";

  const navLinks = [
    { label: t("nav.features"), href: "/#features" },
    { label: t("nav.pricing"), href: "/#pricing" },
    { label: t("footer.aboutUs"), href: "/about-us" },
  ];

  const dashboardLinks = [{ label: t("nav.dashboard"), href: "/dashboard" }];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const getThemeTitle = () =>
    theme === "light" ? "Dark theme (click to switch)" : "Light theme (click to switch)";

  const persistPreferredLanguage = async (lang: "en" | "sw") => {
    if (!user?.id) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_language: lang })
      .eq("id", user.id);
    if (error) console.error("[navbar] preferred_language sync failed", error);
    await refetchProfile();
  };

  const handleLanguageChange = (langKey: string) => {
    const lang = langKey === "en" ? "en" : "sw";
    setLanguage(lang);
    void persistPreferredLanguage(lang);
  };

  const renderDashboardMobileNav = () => (
    <div className="space-y-5 border-b pb-5">
      {DASHBOARD_MOBILE_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            {group.label}
          </p>
          <nav className="flex flex-col gap-0.5" aria-label={`${group.label} dashboard navigation`}>
            {group.items.map(({ href, label, Icon, isActive }) => {
              const active = isActive(pathname, status);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleLinkClick}
                  className={cn(
                    "text-foreground flex items-center gap-3 rounded-lg px-2 py-3 text-base transition-colors",
                    active ? "bg-muted text-primary font-semibold" : "hover:bg-muted/80",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <nav className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full backdrop-blur">
      <div className="relative container mx-auto flex w-full items-center justify-between px-4 py-4 md:max-w-6xl">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>

        {/* Desktop Navigation */}
        {isLanding && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const isActive = !link.href.startsWith("/#") && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors lg:text-base ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border-primary/10 hover:bg-muted focus:ring-primary ml-2 inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-2 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none"
                  aria-label={t("nav.dashboard")}
                >
                  <ProfileAvatar
                    name={profileDisplayName}
                    image={profile?.avatar_url ?? user.user_metadata?.avatar_url}
                    size="xs"
                  />
                  <span>{t("nav.dashboard")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 rounded-xl" align="end">
                <div className="space-y-3">
                  <div className="flex flex-col items-center space-y-0.5">
                    <p className="text-sm font-semibold">Hello 👋, {profileFirstName}</p>
                  </div>
                  <div className="flex flex-col gap-2 border-t pt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-light"
                      size="sm"
                      asChild
                    >
                      <Link href="/dashboard" className="w-full">
                        {t("nav.goToDashboard")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-light"
                      size="sm"
                      onClick={logout}
                    >
                      <LogOut className="mr-1 size-4" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                size="sm"
                className="hover:bg-primary/80 dark:hover:bg-primary/20 rounded-full text-sm font-medium shadow-none transition-colors duration-200"
              >
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                size="sm"
                className="hover:bg-primary/80 dark:hover:bg-primary/20 rounded-full text-sm font-medium shadow-none transition-colors duration-200"
              >
                <Link href="/sign-up">{t("nav.signup")}</Link>
              </Button>
            </>
          )}

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border border-gray-200 shadow-none"
            onClick={toggleTheme}
            title={getThemeTitle()}
          >
            {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Language Toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="dark:border-primary/10 h-9 w-9 rounded-full border border-gray-200 shadow-none"
                title={t("nav.language")}
                aria-label={t("nav.language")}
              >
                <Languages className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 space-y-1 p-1">
              {Object.keys(translations).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`hover:bg-accent/5 w-full rounded-sm px-2 py-1.5 text-left text-sm outline-none ${
                    language === lang ? "bg-accent/10 font-medium" : ""
                  }`}
                >
                  {translations[lang as keyof typeof translations].languageLabel}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile: only menu button; theme & language are inside the sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-foreground transition-all duration-200 hover:scale-105 hover:bg-neutral-50 md:hidden"
              >
                <Menu className="size-7 transition-all duration-200" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full max-h-dvh w-full! flex-col gap-0 overflow-hidden p-0 sm:max-w-full!"
            >
              <SheetHeader className="shrink-0 border-b px-6 pt-6 pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                  <div className="flex flex-col gap-5 pb-2">
                    {user ? renderDashboardMobileNav() : null}

                    {isLanding ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                          Explore
                        </p>
                        {navLinks.map((link) => {
                          const isActive = !link.href.startsWith("/#") && pathname === link.href;

                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={handleLinkClick}
                              className={cn(
                                "rounded-lg px-2 py-3 text-base transition-colors",
                                isActive
                                  ? "text-primary bg-muted font-medium"
                                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                              )}
                            >
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : !user ? (
                      <div className="flex flex-col gap-1">
                        {dashboardLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleLinkClick}
                            className={cn(
                              "rounded-lg px-2 py-3 text-base transition-colors",
                              pathname === link.href
                                ? "text-primary bg-muted font-medium"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                            )}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="bg-background shrink-0 space-y-4 border-t px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-sm">Theme</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={toggleTheme}
                      title={getThemeTitle()}
                    >
                      {theme === "light" ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-sm">Language</span>
                    <div className="flex flex-wrap justify-end gap-2">
                      {Object.keys(translations).map((lang) => (
                        <Button
                          key={lang}
                          variant={language === lang ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleLanguageChange(lang)}
                          className="rounded-full"
                        >
                          {translations[lang as keyof typeof translations].languageLabel}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/dashboard"
                        onClick={handleLinkClick}
                        className="border-primary/10 hover:bg-muted flex w-full items-center gap-3 rounded-full border px-2 py-1.5"
                      >
                        <ProfileAvatar
                          name={profileDisplayName}
                          image={profile?.avatar_url ?? user.user_metadata?.avatar_url}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold">
                            Hello 👋, {profileFirstName}
                          </p>
                          <p className="text-muted-foreground text-xs">{t("nav.dashboard")}</p>
                        </div>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          logout();
                          handleLinkClick();
                        }}
                        className="w-full"
                      >
                        <LogOut className="mr-2 size-4" />
                        {t("nav.logout")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/login"
                        onClick={handleLinkClick}
                        className="border-primary/10 hover:bg-muted w-full rounded-full border px-4 py-2 text-center text-xs font-normal 2xl:text-base"
                      >
                        {t("nav.login")}
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={handleLinkClick}
                        className="border-primary/40 bg-primary/40 text-primary-foreground hover:bg-primary/10 w-full rounded-full border px-4 py-2 text-center text-xs font-normal 2xl:text-base"
                      >
                        {t("nav.signup")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* <hr className="from-background to-background via-primary/20 h-0.5 bg-linear-to-r" /> */}
    </nav>
  );
};

export default NavBar;
