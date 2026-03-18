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
import { useSendOtpForOnboarding, useUpdateUserEmail } from "@/hooks/use-auth";
import { useCurrencies } from "@/hooks/use-currencies";
import { useCompleteOnboarding } from "@/hooks/use-onboarding";
import { isGoogleUser, isPhoneUser } from "@/helpers/auth-provider";
import { setOnboardingPendingCookie } from "@/helpers/onboarding-pending-cookie";
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
    email: "",
  });
  const [prefilled, setPrefilled] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const isGoogle = isGoogleUser(user);
  const isPhone = isPhoneUser(user);

  useEffect(() => {
    if (prefilled || !profile || !user) return;
    setForm((prev) => ({
      ...prev,
      fullName:
        profile.full_name?.trim() || (user.user_metadata?.full_name as string) || prev.fullName,
      currency: profile.preferred_currency || prev.currency,
      email: user.email ?? prev.email,
      phone: profile.phone || user.phone || prev.phone,
    }));
    setPrefilled(true);
  }, [profile, prefilled, user]);

  const sendOtpMutation = useSendOtpForOnboarding();
  const updateUserEmailMutation = useUpdateUserEmail();
  const completeOnboarding = useCompleteOnboarding();

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
    if (!user) return;

    if (!form.fullName.trim()) {
      setError("Your name is required");
      return;
    }

    if (isGoogle && !user.phone) {
      const fullNameTrimmed = form.fullName.trim();
      const phoneTrimmed = form.phone.trim();
      if (!fullNameTrimmed) {
        setError("Your name is required");
        return;
      }
      if (!phoneTrimmed) {
        setError("Phone number is required to link your account");
        return;
      }
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

    if (isPhone && !user.email) {
      const fullNameTrimmed = form.fullName.trim();
      const emailTrimmed = form.email.trim();
      if (!fullNameTrimmed) {
        setError("Your name is required");
        return;
      }
      if (!emailTrimmed) {
        setError("Email is required to link your account");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        sessionStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(form));
        setOnboardingPendingCookie({
          fullName: form.fullName,
          businessName: form.businessName,
          location: form.location,
          capacity: form.capacity,
          taxNumber: form.taxNumber,
          currency: form.currency,
        });
        await updateUserEmailMutation.mutateAsync({
          email: emailTrimmed,
          fullName: fullNameTrimmed,
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
        });
        setEmailSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send confirmation email");
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
                <Label htmlFor="fullName">
                  {t("auth.onboarding.yourName")}
                  {!isGoogle && <span className="text-destructive ml-1">*</span>}
                  {isGoogle && form.fullName && (
                    <span className="text-muted-foreground ml-1 font-normal">(from Google)</span>
                  )}
                </Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder={t("auth.onboarding.yourNamePlaceholder")}
                  required
                  disabled={isGoogle && !!(user?.user_metadata?.full_name || profile?.full_name)}
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

                {isGoogle && user && !user.phone && (
                  <div className="basis-2/5 space-y-2">
                    <Label htmlFor="phone">
                      {t("auth.onboarding.phoneOptional")}
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={t("auth.onboarding.phonePlaceholder")}
                      required
                    />
                  </div>
                )}
                {isPhone && user && !user.email && (
                  <div className="basis-2/5 space-y-2">
                    <Label htmlFor="email">
                      Email
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
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

            {emailSent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                <p className="font-medium">Check your email</p>
                <p className="mt-1 text-sm">
                  We sent a confirmation link to <strong>{form.email}</strong>. Click the link to
                  complete your setup.
                </p>
              </div>
            ) : (
              <Button
                type="submit"
                isLoading={
                  submitting || sendOtpMutation.isPending || updateUserEmailMutation.isPending
                }
                className="w-full"
              >
                {t("auth.onboarding.finish")}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
