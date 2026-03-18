"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { useCompleteOnboarding } from "@/hooks/use-onboarding";
import {
  getOnboardingPendingCookie,
  clearOnboardingPendingCookie,
} from "@/helpers/onboarding-pending-cookie";

const ONBOARDING_PENDING_KEY = "onboarding_pending";

const OnboardingCompletePage = () => {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const completeOnboarding = useCompleteOnboarding();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (userLoading || profileLoading || !user || startedRef.current) return;

    const pendingRaw =
      typeof window !== "undefined"
        ? sessionStorage.getItem(ONBOARDING_PENDING_KEY)
        : null;
    const pendingFromCookie = getOnboardingPendingCookie();

    const pending = pendingRaw
      ? (JSON.parse(pendingRaw) as {
          fullName: string;
          businessName: string;
          location: string;
          capacity: string;
          taxNumber?: string;
          currency: string;
        })
      : pendingFromCookie;

    if (!pending) {
      router.replace("/onboarding");
      return;
    }

    startedRef.current = true;
    if (pendingFromCookie) clearOnboardingPendingCookie();

    const businessName =
      pending.businessName.trim() ||
      pending.fullName.trim() ||
      profile?.full_name ||
      "My Business";

    completeOnboarding.mutate(
      {
        userId: user.id,
        currency: pending.currency,
        businessName,
        location: pending.location,
        capacity: pending.capacity,
        taxNumber: pending.taxNumber || undefined,
        fullName: pending.fullName.trim() || profile?.full_name || undefined,
        email: user.email ?? undefined,
      },
      {
        onSuccess: async () => {
          sessionStorage.removeItem(ONBOARDING_PENDING_KEY);
          clearOnboardingPendingCookie();
          await refetch();
          router.replace("/subscribe?from=onboarding");
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  }, [user, userLoading, profile, profileLoading, router, completeOnboarding, refetch]);

  if (error) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
        <Logo size="sm" />{" "}
        <p className="mt-4 text-destructive text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/onboarding")}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Back to onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
      <Logo size="sm" />
      <p className="mt-4 text-muted-foreground text-sm">
        Completing your setup...
      </p>
      <Spinner className="mt-4 size-6" />
    </div>
  );
};

export default OnboardingCompletePage;
