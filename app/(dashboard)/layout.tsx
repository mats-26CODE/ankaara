"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useProfile();

  const onboardingSkipped = useOnboardingStore((s) => s.skipped);
  const profileIncomplete = !!profile && !profile.full_name?.trim() && !onboardingSkipped;

  useEffect(() => {
    if (userLoading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profileIncomplete) {
      router.replace("/onboarding");
      return;
    }
  }, [user, userLoading, profileLoading, profileIncomplete, router]);

  if (userLoading || profileLoading || !user || profileIncomplete) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <NavBar />
      <div className="dashboard-sidebar flex min-h-0 flex-1">
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="flex w-full flex-col">
            <main className="w-full flex-1 overflow-auto p-4 pb-10">{children}</main>
            <Footer />
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
