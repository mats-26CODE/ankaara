"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useTranslation } from "@/hooks/use-translation";
import { getCasualGreeting } from "@/helpers/helpers";
import { UserRound, ChevronRight } from "lucide-react";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();

  const isProfileComplete = profile?.onboarding_completed === true;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
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

      {/* Complete your profile — show when profile is not up to date */}
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

      {/* Placeholder for future dashboard content */}
      {isProfileComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Your invoices, clients and quick actions will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dashboard content coming soon. Use the sidebar to navigate to
              Invoices or Clients.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
