"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useLogout } from "@/hooks/use-user";
import { useLanguage, translations } from "@/lib/stores/preferences-store";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Menu, Sun, Moon, LogOut, Languages } from "lucide-react";
import Logo from "./logo";
import { useTheme } from "@/lib/stores/preferences-store";
import { ProfileAvatar } from "./profile-avatar";

const NavBar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const logout = useLogout();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
  ];

  const dashboardLinks = [{ label: t("nav.dashboard"), href: "/dashboard" }];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const getThemeTitle = () =>
    theme === "light" ? "Dark theme (click to switch)" : "Light theme (click to switch)";

  return (
    <nav className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full backdrop-blur">
      <div className="container mx-auto flex h-20 w-full items-center justify-between px-4 md:max-w-6xl">
        <div className="flex items-center gap-4 md:gap-8">
          <Logo size="sm" />

          {/* Desktop Navigation */}
          {pathname === "/" && (
            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors xl:text-base ${
                    pathname === link.href
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="border-primary/10 hover:bg-muted focus:ring-primary ml-2 inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-offset-2 focus:outline-none"
                  aria-label={t("nav.dashboard")}
                >
                  <ProfileAvatar
                    name={user.user_metadata?.name || user.email || user.phone || undefined}
                    image={user.user_metadata?.avatar_url}
                    size="xs"
                  />
                  <span>{t("nav.dashboard")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 rounded-xl" align="end">
                <div className="space-y-3">
                  <div className="flex flex-col items-center space-y-0.5">
                    <p className="text-sm font-semibold">
                      {user.user_metadata?.name || user.email || user.phone || "User"}
                    </p>
                    {(user.email || user.phone) && (
                      <p className="text-muted-foreground text-xs">{user.email || user.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 border-t pt-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-light"
                      size="sm"
                      asChild
                    >
                      <Link href="/dashboard" className="w-full">
                        Go to {t("nav.dashboard")}
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
              <Link
                href="/login"
                className="border-primary/10 hover:bg-muted ml-2 rounded-full border px-6 py-2 text-sm font-medium"
              >
                {t("nav.login")}
              </Link>
              <Button
                asChild
                size="sm"
                className="hover:bg-muted ml-2 rounded-full text-sm font-medium"
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
                title={t("nav.language") || "Language"}
                aria-label={t("nav.language") || "Language"}
              >
                <Languages className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 space-y-1 p-1">
              {Object.keys(translations).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang as keyof typeof translations)}
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
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-7" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full! p-0 sm:max-w-full!">
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-6 pb-6">
                {pathname === "/"
                  ? navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className="text-muted-foreground hover:text-foreground py-2 text-base transition-colors"
                      >
                        {link.label}
                      </a>
                    ))
                  : dashboardLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`py-2 text-base transition-colors ${
                          pathname === link.href
                            ? "text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Theme & Language - Mobile Menu */}
                  <div className="flex items-center justify-between">
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
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Language</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(translations).map((lang) => (
                        <Button
                          key={lang}
                          variant={language === lang ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setLanguage(lang as keyof typeof translations)}
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
                          name={user.user_metadata?.name || user.email || user.phone || undefined}
                          image={user.user_metadata?.avatar_url}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold">
                            {user.user_metadata?.name || user.email || user.phone || "User"}
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
      <hr className="via-primary/20 h-0.5 bg-linear-to-r from-transparent to-transparent" />
    </nav>
  );
};

export default NavBar;
