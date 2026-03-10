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
import { Building2, User } from "lucide-react";
import { addCountryCode } from "@/helpers/helpers";
import { useSendOtpForOnboarding } from "@/hooks/use-auth";
import { useCurrencies } from "@/hooks/use-currencies";
import { useCompleteOnboarding, useSkipOnboarding } from "@/hooks/use-onboarding";
import type { Profile } from "@/hooks/use-profile";

const ONBOARDING_PENDING_KEY = "onboarding_pending";

/**
 * True when the profile has all essential fields filled.
 * Must match the logic in the dashboard page so we don't loop.
 */
const isProfileActuallyComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  return !!(
    profile.full_name?.trim() &&
    profile.account_type
  );
};

const OnboardingPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    accountType: "" as "" | "business" | "individual",
    businessName: "",
    individualName: "",
    location: "",
    capacity: "",
    currency: "TZS",
    phone: "",
  });
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !profile) return;
    setForm((prev) => ({
      ...prev,
      accountType: profile.account_type || prev.accountType,
      individualName: profile.full_name?.trim() || prev.individualName,
      currency: profile.preferred_currency || prev.currency,
    }));
    setPrefilled(true);
  }, [profile, prefilled]);
  const sendOtpMutation = useSendOtpForOnboarding();
  const completeOnboarding = useCompleteOnboarding();
  const skipOnboarding = useSkipOnboarding();
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
    if (step === 1) {
      if (!form.accountType) {
        setError("Please select an account type");
        return;
      }
      setStep(2);
      return;
    }

    const isBusiness = form.accountType === "business";
    if (isBusiness && !form.businessName.trim()) {
      setError("Business name is required");
      return;
    }
    if (!isBusiness && !form.individualName.trim()) {
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
          `/verify-otp?phone=${encodeURIComponent(addCountryCode(phoneTrimmed))}&intent=onboarding`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send OTP");
        setSubmitting(false);
      }
      return;
    }

    const businessName = isBusiness
      ? form.businessName.trim()
      : form.individualName.trim() || profile?.full_name || "My Business";

    setSubmitting(true);
    completeOnboarding.mutate(
      {
        userId: user!.id,
        accountType: form.accountType as "business" | "individual",
        currency: form.currency,
        businessName,
        location: form.location,
        capacity: form.capacity,
        fullName: isBusiness ? undefined : (form.individualName.trim() || profile?.full_name || undefined),
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
      }
    );
  };

  if (userLoading || profileLoading || currenciesLoading || !user || profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {t("auth.onboarding.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.onboarding.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Label>{t("auth.onboarding.accountType")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, accountType: "business" }))
                    }
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      form.accountType === "business"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Building2 className="size-8" />
                    <span className="font-medium">
                      {t("auth.onboarding.business")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, accountType: "individual" }))
                    }
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      form.accountType === "individual"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className="size-8" />
                    <span className="font-medium">
                      {t("auth.onboarding.individual")}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && form.accountType === "business" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    {t("auth.onboarding.businessName")}
                  </Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, businessName: e.target.value }))
                    }
                    placeholder={t("auth.onboarding.businessNamePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">
                    {t("auth.onboarding.location")}
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder={t("auth.onboarding.locationPlaceholder")}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    {t("auth.onboarding.capacity")}
                  </Label>
                  <Input
                    id="capacity"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, capacity: e.target.value }))
                    }
                    placeholder={t("auth.onboarding.capacityPlaceholder")}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.onboarding.currency")}</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, currency: v }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.name} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {showOptionalPhone && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t("auth.onboarding.phoneOptional")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder={t("auth.onboarding.phonePlaceholder")}
                      className="h-11"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 2 && form.accountType === "individual" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="individualName">
                    {t("auth.onboarding.yourName")}
                  </Label>
                  <Input
                    id="individualName"
                    value={form.individualName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, individualName: e.target.value }))
                    }
                    placeholder={t("auth.onboarding.yourNamePlaceholder")}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.onboarding.currency")}</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, currency: v }))
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.name} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {showOptionalPhone && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneIndividual">
                      {t("auth.onboarding.phoneOptional")}
                    </Label>
                    <Input
                      id="phoneIndividual"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder={t("auth.onboarding.phonePlaceholder")}
                      className="h-11"
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={submitting || sendOtpMutation.isPending}
                className={step === 1 ? "w-full" : "flex-1"}
              >
                {submitting || sendOtpMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : step === 1 ? (
                  t("auth.onboarding.next")
                ) : (
                  t("auth.onboarding.finish")
                )}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setSubmitting(true);
                setError(null);
                skipOnboarding.mutate(
                  {
                    userId: user!.id,
                    currency: form.currency,
                    fullName: profile?.full_name || undefined,
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
                  }
                );
              }}
              disabled={submitting || skipOnboarding.isPending}
              className="hover:underline text-muted-foreground"
            >
              Skip for now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
