"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useLogout } from "@/hooks/use-user";
import { useLanguage, translations } from "@/lib/stores/preferences-store";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
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
    theme === "light"
      ? "Dark theme (click to switch)"
      : "Light theme (click to switch)";

  return (
    <nav className="w-full sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container w-full md:max-w-6xl mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="-mt-2">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm xl:text-base transition-colors ${
                  pathname === link.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-24 rounded-full shadow-none border border-gray-200 dark:border-primary/10 px-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(translations).map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {
                    translations[lang as keyof typeof translations]
                      .languageLabel
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="ml-2 inline-flex items-center gap-2 px-2 py-1.5 border border-primary/10 rounded-full text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={t("nav.dashboard")}
                >
                  <ProfileAvatar
                    name={
                      user.user_metadata?.name ||
                      user.email ||
                      user.phone ||
                      undefined
                    }
                    image={user.user_metadata?.avatar_url}
                    size="xs"
                  />
                  <span>{t("nav.dashboard")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {user.user_metadata?.name ||
                        user.email ||
                        user.phone ||
                        "User"}
                    </p>
                    {(user.email || user.phone) && (
                      <p className="text-xs text-muted-foreground">
                        {user.email || user.phone}
                      </p>
                    )}
                  </div>
                  <div className="border-t pt-2 flex flex-col gap-1">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-sm font-light"
                      size="sm"
                      asChild
                    >
                      <Link href="/dashboard" className="w-full">
                        {t("nav.dashboard")}
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
                className="ml-2 px-6 py-2 border border-primary/10 rounded-full text-sm font-medium hover:bg-muted"
              >
                {t("nav.login")}
              </Link>
              <Button
                asChild
                size="sm"
                className="ml-2 rounded-full text-sm font-medium hover:bg-muted"
              >
                <Link href="/sign-up">{t("nav.signup")}</Link>
              </Button>
            </>
          )}

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-none border border-gray-200"
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme Toggle - Mobile */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
            title={getThemeTitle()}
          >
            {theme === "light" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-20 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(translations).map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {
                    translations[lang as keyof typeof translations]
                      .languageLabel
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full! sm:max-w-full! p-0">
              <SheetHeader className="px-6 pt-6 pb-4">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="px-6 pb-6 flex flex-col gap-4">
                {pathname === "/"
                  ? navLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
                      >
                        {link.label}
                      </a>
                    ))
                  : dashboardLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={handleLinkClick}
                        className={`text-base transition-colors py-2 ${
                          pathname === link.href
                            ? "text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                <div className="border-t pt-4 mt-4 space-y-4">
                  {/* Theme Toggle - Mobile Menu */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
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
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/dashboard"
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 w-full px-2 py-1.5 border border-primary/10 rounded-full hover:bg-muted"
                      >
                        <ProfileAvatar
                          name={
                            user.user_metadata?.name ||
                            user.email ||
                            user.phone ||
                            undefined
                          }
                          image={user.user_metadata?.avatar_url}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold truncate">
                            {user.user_metadata?.name ||
                              user.email ||
                              user.phone ||
                              "User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("nav.dashboard")}
                          </p>
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
                        className="w-full px-4 py-2 border border-primary/10 rounded-full text-xs 2xl:text-base font-normal hover:bg-muted text-center"
                      >
                        {t("nav.login")}
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={handleLinkClick}
                        className="w-full px-4 py-2 border border-primary/40 rounded-full bg-primary/40 text-primary-foreground text-xs 2xl:text-base font-normal hover:bg-primary/10 text-center"
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
      <hr className="bg-linear-to-r h-0.5 from-transparent via-primary/20 to-transparent" />
    </nav>
  );
};

export default NavBar;
