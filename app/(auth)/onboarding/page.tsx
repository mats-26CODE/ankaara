"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { addCountryCode } from "@/helpers/helpers";
import { useSendOtpForOnboarding } from "@/hooks/use-auth";
import { useCurrencies } from "@/hooks/use-currencies";
import { useCompleteOnboarding, useSkipOnboarding } from "@/hooks/use-onboarding";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import type { Profile } from "@/hooks/use-profile";

const ONBOARDING_PENDING_KEY = "onboarding_pending";

const isProfileActuallyComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  return !!profile.full_name?.trim();
};

const OnboardingPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    location: "",
    capacity: "",
    taxNumber: "",
    currency: "TZS",
    phone: "",
  });
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !profile) return;
    setForm((prev) => ({
      ...prev,
      fullName: profile.full_name?.trim() || prev.fullName,
      currency: profile.preferred_currency || prev.currency,
    }));
    setPrefilled(true);
  }, [profile, prefilled]);

  const sendOtpMutation = useSendOtpForOnboarding();
  const completeOnboarding = useCompleteOnboarding();
  const skipOnboarding = useSkipOnboarding();
  const setOnboardingSkipped = useOnboardingStore((s) => s.setSkipped);
  const showOptionalPhone = !profile?.phone;

  const profileComplete = isProfileActuallyComplete(profile);

  useEffect(() => {
    if (userLoading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profileComplete) {
      router.replace("/dashboard");
    }
  }, [user, userLoading, profileComplete, profileLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) {
      setError("Your name is required");
      return;
    }

    const phoneTrimmed = form.phone.trim();
    if (showOptionalPhone && phoneTrimmed) {
      setSubmitting(true);
      setError(null);
      try {
        sessionStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(form));
        await sendOtpMutation.mutateAsync({
          phone: addCountryCode(phoneTrimmed),
        });
        router.push(
          `/verify-otp?phone=${encodeURIComponent(addCountryCode(phoneTrimmed))}&intent=onboarding`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send OTP");
        setSubmitting(false);
      }
      return;
    }

    const businessName =
      form.businessName.trim() || form.fullName.trim() || profile?.full_name || "My Business";

    setSubmitting(true);
    completeOnboarding.mutate(
      {
        userId: user!.id,
        currency: form.currency,
        businessName,
        location: form.location,
        capacity: form.capacity,
        taxNumber: form.taxNumber || undefined,
        fullName: form.fullName.trim() || profile?.full_name || undefined,
      },
      {
        onSuccess: async () => {
          await refetch();
          router.replace("/dashboard");
        },
        onError: (err) => {
          setError(err.message);
          setSubmitting(false);
        },
      },
    );
  };

  if (userLoading || profileLoading || currenciesLoading || !user || profileComplete) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="mx-auto px-4 py-8 sm:py-12 md:w-2xl">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" />
        </div>

        <div className="bg-background rounded-4xl border p-6 sm:p-8">
          <div className="space-y-1 text-center">
            <h1 className="text-foreground text-center text-2xl font-semibold">
              {t("auth.onboarding.title")}
            </h1>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              {t("auth.onboarding.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.onboarding.yourName")}</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder={t("auth.onboarding.yourNamePlaceholder")}
                  required
                />
              </div>

              <div className="items-center justify-between gap-3 md:flex md:gap-5">
                <div className="basis-3/4 space-y-2">
                  <Label htmlFor="businessName">
                    {t("auth.onboarding.businessName")}
                    <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                    placeholder={t("auth.onboarding.businessNamePlaceholder")}
                  />
                </div>

                <div className="basis-1/4 space-y-2 md:mt-2">
                  <Label>{t("auth.onboarding.currency")}</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="items-center justify-between gap-3 md:flex md:gap-5">
                <div className="basis-3/5 space-y-2">
                  <Label htmlFor="location">
                    {t("auth.onboarding.location")}
                    <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder={t("auth.onboarding.locationPlaceholder")}
                  />
                </div>

                {showOptionalPhone && (
                  <div className="basis-2/5 space-y-2">
                    <Label htmlFor="phone">{t("auth.onboarding.phoneOptional")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t("auth.onboarding.phonePlaceholder")}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t("auth.onboarding.capacity")}</Label>
                  <Input
                    id="capacity"
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                    placeholder={t("auth.onboarding.capacityPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">TIN / VAT Number</Label>
                  <Input
                    id="taxNumber"
                    value={form.taxNumber}
                    onChange={(e) => setForm((p) => ({ ...p, taxNumber: e.target.value }))}
                    placeholder="e.g. 123-456-789"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              isLoading={submitting || sendOtpMutation.isPending}
              className="w-full"
            >
              {t("auth.onboarding.finish")}
            </Button>
          </form>
        </div>

        <p className="text-muted-foreground mt-5 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setOnboardingSkipped(true);
              skipOnboarding.mutate({
                userId: user!.id,
                currency: form.currency,
                fullName: profile?.full_name || undefined,
              });
              router.replace("/dashboard");
            }}
            disabled={submitting || skipOnboarding.isPending}
            className="text-muted-foreground hover:underline"
          >
            Skip for now
          </button>
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
