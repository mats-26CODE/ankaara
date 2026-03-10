"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  useVerifyOtp,
  useSendOtp,
  useVerifyOtpForOnboarding,
  useSendOtpForOnboarding,
} from "@/hooks/use-auth";
import { useOtpCountdown } from "@/hooks/use-otp-countdown";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { useTranslation } from "@/hooks/use-translation";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { useCompleteOnboarding } from "@/hooks/use-onboarding";

const ONBOARDING_PENDING_KEY = "onboarding_pending";

const VerifyOtpContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { profile, refetch: refetchProfile } = useProfile();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const intent = searchParams.get("intent");
  const isOnboarding = intent === "onboarding";

  const verifyOtpMutation = useVerifyOtp();
  const sendOtpMutation = useSendOtp(true);
  const verifyOtpForOnboardingMutation = useVerifyOtpForOnboarding();
  const sendOtpForOnboardingMutation = useSendOtpForOnboarding();
  const completeOnboarding = useCompleteOnboarding();
  const { countdown, canResend, startCountdown } = useOtpCountdown(60);

  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    if (phoneParam) {
      setPhone(decodeURIComponent(phoneParam));
      startCountdown();
    } else {
      router.push("/login");
    }
  }, [searchParams, router, startCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || !otp) {
      setError(t("auth.verifyOtp.fillAllFields"));
      return;
    }

    if (isOnboarding) {
      verifyOtpForOnboardingMutation.mutate(
        { phone, code: otp },
        {
          onSuccess: () => {
            const pendingRaw =
              typeof window !== "undefined"
                ? sessionStorage.getItem(ONBOARDING_PENDING_KEY)
                : null;
            if (!pendingRaw || !user?.id) {
              router.replace("/dashboard");
              return;
            }
            const pending = JSON.parse(pendingRaw) as {
              accountType: string;
              businessName: string;
              individualName: string;
              location: string;
              capacity: string;
              currency: string;
            };
            const isBusiness = pending.accountType === "business";
            const businessName = isBusiness
              ? pending.businessName.trim()
              : pending.individualName.trim() || profile?.full_name || "My Business";

            completeOnboarding.mutate(
              {
                userId: user.id,
                accountType: pending.accountType as "business" | "individual",
                currency: pending.currency,
                businessName,
                location: pending.location,
                capacity: pending.capacity,
                fullName: isBusiness
                  ? undefined
                  : (pending.individualName.trim() || profile?.full_name || undefined),
                phone,
              },
              {
                onSuccess: async () => {
                  sessionStorage.removeItem(ONBOARDING_PENDING_KEY);
                  await refetchProfile();
                  router.replace("/dashboard");
                },
              }
            );
          },
        }
      );
    } else {
      verifyOtpMutation.mutate({ phone, otp });
    }
  };

  const handleResendOtp = () => {
    if (!phone) {
      setError(t("auth.verifyOtp.phoneRequired"));
      return;
    }
    if (!canResend) return;
    if (isOnboarding) {
      sendOtpForOnboardingMutation.mutate(
        { phone },
        { onSuccess: () => startCountdown() }
      );
    } else {
      sendOtpMutation.mutate(
        { phone },
        { onSuccess: () => startCountdown() }
      );
    }
  };

  return (
    <div className="min-h-screen max-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <Logo />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {t("auth.verifyOtp.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("auth.verifyOtp.subtitle")} <strong>{phone}</strong>
          </p>
        </div>

        {(error ||
          verifyOtpMutation.isError ||
          sendOtpMutation.isError ||
          verifyOtpForOnboardingMutation.isError ||
          sendOtpForOnboardingMutation.isError) && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error ||
              (verifyOtpMutation.error instanceof Error
                ? verifyOtpMutation.error.message
                : verifyOtpForOnboardingMutation.error instanceof Error
                ? verifyOtpForOnboardingMutation.error.message
                : sendOtpMutation.error instanceof Error
                ? sendOtpMutation.error.message
                : sendOtpForOnboardingMutation.error instanceof Error
                ? sendOtpForOnboardingMutation.error.message
                : t("auth.verifyOtp.error"))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <InputGroup className="bg-muted/50 border border-primary/20 text-foreground placeholder:text-muted-foreground h-10 flex-1">
              <InputGroupInput
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder={t("auth.verifyOtp.codePlaceholder")}
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </InputGroup>
            <p className="text-xs text-muted-foreground text-center">
              {t("auth.verifyOtp.codeHint")}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              (isOnboarding
                ? verifyOtpForOnboardingMutation.isPending
                : verifyOtpMutation.isPending) || !phone || !otp
            }
          >
            {isOnboarding
              ? verifyOtpForOnboardingMutation.isPending
                ? t("auth.verifyOtp.verifying")
                : t("auth.verifyOtp.verify")
              : verifyOtpMutation.isPending
              ? t("auth.verifyOtp.verifying")
              : t("auth.verifyOtp.verify")}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.verifyOtp.noCode")}{" "}
          {canResend ? (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={
                isOnboarding
                  ? sendOtpForOnboardingMutation.isPending
                  : sendOtpMutation.isPending
              }
              className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOnboarding
                ? sendOtpForOnboardingMutation.isPending
                  ? t("auth.verifyOtp.sending")
                  : t("auth.verifyOtp.resend")
                : sendOtpMutation.isPending
                ? t("auth.verifyOtp.sending")
                : t("auth.verifyOtp.resend")}
            </button>
          ) : (
            <span className="text-muted-foreground">
              {t("auth.verifyOtp.resendIn", { seconds: countdown.toString() })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

const VerifyOtpPage = () => (
  <Suspense>
    <VerifyOtpContent />
  </Suspense>
);

export default VerifyOtpPage;
