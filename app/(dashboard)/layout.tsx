"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (userLoading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, userLoading, profile, profileLoading, router]);

  if (userLoading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <div className="dashboard-sidebar flex flex-1 min-h-0">
        <SidebarProvider>
          <DashboardSidebar />
          <SidebarInset className="flex flex-col w-full">
            <main className="flex-1 overflow-auto w-full p-4 pb-10">
              {children}
            </main>
            <Footer />
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
