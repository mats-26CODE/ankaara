"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/hooks/use-translation";
import { createClient } from "@/lib/supabase/client";
import { getCasualGreeting } from "@/helpers/helpers";
import { useFormatAmount } from "@/hooks/use-format-amount";
import {
  UserRound,
  ChevronRight,
  FileText,
  Users,
  Plus,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";

type InvoiceStats = {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  currency: string;
};

type ClientCount = number;

/**
 * Check whether the profile has the essential fields filled in.
 * "Skip for now" sets onboarding_completed but leaves fields empty — we
 * treat the profile as incomplete when key data is missing.
 * Phone is optional so it's excluded from the essential check.
 */
const checkProfileCompleteness = (
  profile: ReturnType<typeof useProfile>["profile"]
) => {
  if (!profile) return { complete: false, missing: [] as string[] };

  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push("name");
  if (!profile.account_type) missing.push("account type");

  return { complete: missing.length === 0, missing };
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { profile, loading: profileLoading } = useProfile();
  const { format: formatAmount } = useFormatAmount();
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    totalRevenue: 0,
    currency: "TZS",
  });
  const [clientCount, setClientCount] = useState<ClientCount>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    const supabase = createClient();

    // Get user's business ids
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, currency")
      .eq("owner_id", user.id);

    if (!businesses || businesses.length === 0) {
      setStatsLoading(false);
      return;
    }

    const bizIds = businesses.map((b: { id: string }) => b.id);
    const currency = businesses[0]?.currency || "TZS";

    // Invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("status, total")
      .in("organization_id", bizIds);

    const stats: InvoiceStats = {
      total: 0,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      totalRevenue: 0,
      currency,
    };

    if (invoices) {
      stats.total = invoices.length;
      for (const inv of invoices) {
        const s = inv.status as string;
        if (s === "draft") stats.draft++;
        else if (s === "sent" || s === "viewed") stats.sent++;
        else if (s === "paid") {
          stats.paid++;
          stats.totalRevenue += Number(inv.total) || 0;
        } else if (s === "overdue") stats.overdue++;
      }
    }
    setInvoiceStats(stats);

    // Clients
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .in("organization_id", bizIds);

    setClientCount(count || 0);
    setStatsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { complete: isProfileComplete, missing } =
    checkProfileCompleteness(profile);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ────── Welcome Header ────── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {getCasualGreeting()}
          {profile?.full_name?.trim()
            ? `, ${profile.full_name.trim().split(/\s+/)[0]}`
            : ""}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.home.greetingSubtitle")}
        </p>
      </div>

      {/* ────── Complete your profile banner ────── */}
      {!isProfileComplete && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="size-6 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl">
                    {t("dashboard.home.completeProfileTitle")}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t("dashboard.home.completeProfileDescription")}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground">
                    Missing: {missing.join(", ")}
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/onboarding" className="gap-2">
                  {t("dashboard.home.completeProfileCta")}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* ────── Profile Card ────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatar
                name={profile?.full_name || undefined}
                image={profile?.avatar_url}
                size="xl"
                className="border-2 border-border"
              />
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {profile?.full_name || profile?.email || "Your Account"}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {profile?.email && <span>{profile.email}</span>}
                  {profile?.phone && (
                    <>
                      <span>•</span>
                      <span>{profile.phone}</span>
                    </>
                  )}
                </div>
                {profile?.account_type && (
                  <span className="inline-block mt-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                    {profile.account_type}
                  </span>
                )}
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-bold">
                {statsLoading
                  ? "—"
                  : formatAmount(invoiceStats.totalRevenue, {
                      decimalDigits: 0,
                    })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <p className="text-lg font-bold">
                {statsLoading ? "—" : invoiceStats.total}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="text-lg font-bold">
                {statsLoading ? "—" : clientCount}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ────── Stats Grid ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "—" : invoiceStats.paid}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices collected
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/invoices?status=paid">View all</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "—" : invoiceStats.sent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/invoices?status=sent">View all</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "—" : invoiceStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need follow-up</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/invoices?status=overdue">View all</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="size-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "—" : invoiceStats.draft}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Not yet sent</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/dashboard/invoices?status=draft">View all</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* ────── Quick Actions + Account Summary ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/invoices/create">
                <Plus className="mr-2 size-4" />
                Create Invoice
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/clients">
                <Users className="mr-2 size-4" />
                Manage Clients
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/invoices">
                <FileText className="mr-2 size-4" />
                All Invoices
              </Link>
            </Button>
            <Separator className="my-2" />
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Your account overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Account Type
              </span>
              <span className="text-sm font-medium capitalize">
                {profile?.account_type || "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Phone Verified
              </span>
              <span className="text-sm font-medium">
                {profile?.phone ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Yes
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <Clock className="size-3.5" /> Not yet
                  </span>
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Profile Complete
              </span>
              <span className="text-sm font-medium">
                {isProfileComplete ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Yes
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <Clock className="size-3.5" /> Incomplete
                  </span>
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Member Since
              </span>
              <span className="text-sm font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
