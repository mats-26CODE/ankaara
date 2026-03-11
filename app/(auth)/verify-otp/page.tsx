"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  useVerifyOtp,
  useSendOtp,
  useVerifyOtpForOnboarding,
  useSendOtpForOnboarding,
} from "@/hooks/use-auth";
import { useOtpCountdown } from "@/hooks/use-otp-countdown";
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

  const isVerifying = isOnboarding
    ? verifyOtpForOnboardingMutation.isPending
    : verifyOtpMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || otp.length < 6) {
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
              fullName: string;
              businessName: string;
              location: string;
              capacity: string;
              taxNumber?: string;
              currency: string;
            };
            const businessName = pending.businessName.trim() || pending.fullName.trim() || profile?.full_name || "My Business";

            completeOnboarding.mutate(
              {
                userId: user.id,
                currency: pending.currency,
                businessName,
                location: pending.location,
                capacity: pending.capacity,
                taxNumber: pending.taxNumber || undefined,
                fullName: pending.fullName.trim() || profile?.full_name || undefined,
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

  const hasError =
    !!error ||
    verifyOtpMutation.isError ||
    sendOtpMutation.isError ||
    verifyOtpForOnboardingMutation.isError ||
    sendOtpForOnboardingMutation.isError;

  const errorMessage =
    error ||
    (verifyOtpMutation.error instanceof Error
      ? verifyOtpMutation.error.message
      : verifyOtpForOnboardingMutation.error instanceof Error
        ? verifyOtpForOnboardingMutation.error.message
        : sendOtpMutation.error instanceof Error
          ? sendOtpMutation.error.message
          : sendOtpForOnboardingMutation.error instanceof Error
            ? sendOtpForOnboardingMutation.error.message
            : t("auth.verifyOtp.error"));

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

        {hasError && (
          <div className="w-full p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="space-y-3 flex flex-col items-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={setOtp}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center">
              {t("auth.verifyOtp.codeHint")}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!phone || otp.length < 6}
            isLoading={isVerifying}
          >
            {t("auth.verifyOtp.verify")}
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
