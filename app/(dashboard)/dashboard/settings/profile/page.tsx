"use client";

import { useState, useEffect } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useIsStaffUser } from "@/hooks/use-staff-permissions";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { useCurrencies } from "@/hooks/use-currencies";
import { useTheme, useLanguage } from "@/lib/stores/preferences-store";
import {
  useDeleteAccount,
  useRequestAccountDeletionOtp,
  useSendOtpForPhoneChange,
  useVerifyPhoneChange,
} from "@/hooks/use-auth";
import { ToastAlert } from "@/config/toast";
import { useOtpCountdown } from "@/hooks/use-otp-countdown";
import { addCountryCode, clampPhoneDigitInput, formatPhoneForDisplay } from "@/helpers/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "next/navigation";

const ProfileSettingsPage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const isStaff = useIsStaffUser();
  const { user } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const sendOtp = useSendOtpForPhoneChange();
  const verifyPhoneChange = useVerifyPhoneChange();
  const requestDeletionOtp = useRequestAccountDeletionOtp();
  const deleteAccount = useDeleteAccount();
  const { countdown, canResend, startCountdown } = useOtpCountdown(60);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    preferred_currency: "TZS",
  });

  const [prefilled, setPrefilled] = useState(false);

  const [phoneConfirmDialogOpen, setPhoneConfirmDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState("");

  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deleteOtpDialogOpen, setDeleteOtpDialogOpen] = useState(false);
  const [deleteOtpCode, setDeleteOtpCode] = useState("");
  const [deleteOtpError, setDeleteOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (isStaff) {
      router.replace("/dashboard");
    }
  }, [isStaff, router]);

  useEffect(() => {
    if (prefilled || !profile) return;
    const rawPhone = profile.phone || user?.phone || "";
    setForm({
      full_name: profile.full_name || "",
      phone: rawPhone ? clampPhoneDigitInput(formatPhoneForDisplay(rawPhone)) : "",
      avatar_url: profile.avatar_url || "",
      preferred_currency: profile.preferred_currency || "TZS",
    });
    setPrefilled(true);
  }, [profile, prefilled, user?.phone]);

  const handleLanguageChange = (value: string) => {
    const lang = value === "en" ? "en" : "sw";
    setLanguage(lang);
    if (!user?.id) return;
    const supabase = createClient();
    void supabase
      .from("profiles")
      .update({ preferred_language: lang })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) console.error("[profile] preferred_language sync failed", error);
        else void refetch();
      });
  };

  const phoneChanged = () => {
    const newPhone = addCountryCode(form.phone.trim());
    const existingPhone = profile?.phone || "";
    return !!form.phone.trim() && newPhone !== existingPhone;
  };

  const handleSave = () => {
    if (phoneChanged()) {
      setPendingPhone(addCountryCode(form.phone.trim()));
      setPhoneConfirmDialogOpen(true);
      return;
    }

    saveProfile();
  };

  const handleConfirmPhoneChange = () => {
    setOtpCode("");
    setOtpError(null);
    sendOtp.mutate(
      { phone: pendingPhone },
      {
        onSuccess: () => {
          setPhoneConfirmDialogOpen(false);
          setOtpDialogOpen(true);
          startCountdown();
        },
      },
    );
  };

  const saveProfile = (verifiedPhone?: string) => {
    updateProfile.mutate(
      {
        full_name: form.full_name.trim() || undefined,
        phone: verifiedPhone ?? (form.phone.trim() ? addCountryCode(form.phone.trim()) : null),
        avatar_url: form.avatar_url.trim() || null,
        preferred_currency: form.preferred_currency,
      },
      {
        onSuccess: () => refetch(),
      },
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 6) return;
    setOtpError(null);
    verifyPhoneChange.mutate(
      {
        phone: pendingPhone,
        code: otpCode,
        profile: {
          full_name: form.full_name.trim() || undefined,
          avatar_url: form.avatar_url.trim() || null,
          preferred_currency: form.preferred_currency,
        },
      },
      {
        onError: (err) => {
          setOtpError(err.message || t("dashboard.settings.profile.otpVerificationFailed"));
        },
      },
    );
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setOtpError(null);
    sendOtp.mutate({ phone: pendingPhone }, { onSuccess: () => startCountdown() });
  };

  const handleConfirmStartDelete = () => {
    requestDeletionOtp.mutate(undefined, {
      onSuccess: () => {
        setDeleteConfirmDialogOpen(false);
        setDeleteOtpCode("");
        setDeleteOtpError(null);
        setDeleteOtpDialogOpen(true);
      },
    });
  };

  const handleConfirmDelete = () => {
    if (deleteOtpCode.length < 6) return;
    setDeleteOtpError(null);
    deleteAccount.mutate(
      { code: deleteOtpCode },
      {
        onSuccess: () => {
          setDeleteOtpDialogOpen(false);
          ToastAlert.success(t("dashboard.settings.profile.deleteSuccess"));
        },
        onError: (err) => setDeleteOtpError(err.message),
      },
    );
  };

  if (isStaff) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (profileLoading || currenciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSaving = updateProfile.isPending || sendOtp.isPending || verifyPhoneChange.isPending;

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.profile.sectionTitle")}</CardTitle>
          <CardDescription>{t("dashboard.settings.profile.sectionDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage
                src={form.avatar_url || undefined}
                alt={t("dashboard.settings.profile.avatarAlt")}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label htmlFor="avatar_url">{t("dashboard.settings.profile.avatarUrlLabel")}</Label>
              <Input
                id="avatar_url"
                value={form.avatar_url}
                onChange={(e) => setForm((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder={t("dashboard.settings.profile.avatarUrlPlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("dashboard.settings.profile.fullNameLabel")}</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder={t("dashboard.settings.profile.fullNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("dashboard.common.email")}</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("dashboard.common.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    phone: clampPhoneDigitInput(e.target.value),
                  }))
                }
                placeholder={t("dashboard.settings.profile.phonePlaceholder")}
              />
              {phoneChanged() && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t("dashboard.settings.profile.phoneChangeWarning")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.settings.profile.preferredCurrencyLabel")}</Label>
              <Select
                value={form.preferred_currency}
                onValueChange={(v) => setForm((p) => ({ ...p, preferred_currency: v }))}
              >
                <SelectTrigger className="w-full">
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
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={isSaving}>
              {t("dashboard.common.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.profile.preferencesTitle")}</CardTitle>
          <CardDescription>
            {t("dashboard.settings.profile.preferencesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("dashboard.settings.profile.themeLabel")}</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    {t("dashboard.settings.profile.themeLight")}
                  </SelectItem>
                  <SelectItem value="dark">{t("dashboard.settings.profile.themeDark")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.settings.profile.languageLabel")}</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("dashboard.settings.profile.languageEn")}</SelectItem>
                  <SelectItem value="sw">{t("dashboard.settings.profile.languageSw")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="text-muted-foreground text-xs">
            {t("dashboard.settings.profile.preferencesFootnote")}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("dashboard.settings.profile.dangerTitle")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.settings.profile.dangerDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteConfirmDialogOpen(true)}>
            {t("dashboard.settings.profile.deleteButton")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={phoneConfirmDialogOpen} onOpenChange={setPhoneConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.profile.phoneConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.profile.phoneConfirmDescription", {
                phone: formatPhoneForDisplay(pendingPhone),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPhoneConfirmDialogOpen(false)}
              disabled={sendOtp.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button onClick={handleConfirmPhoneChange} isLoading={sendOtp.isPending}>
              {t("dashboard.common.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.profile.otpTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.profile.otpDescription", {
                phone: formatPhoneForDisplay(pendingPhone),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otpCode}
              onChange={setOtpCode}
              disabled={verifyPhoneChange.isPending}
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

            {otpError && <p className="text-destructive text-sm">{otpError}</p>}

            <p className="text-muted-foreground text-center text-xs">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendOtp.isPending}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  {sendOtp.isPending
                    ? t("dashboard.settings.profile.otpSending")
                    : t("dashboard.settings.profile.otpResendCode")}
                </button>
              ) : (
                <span>
                  {t("dashboard.settings.profile.otpResendCountdown", {
                    countdown: String(countdown),
                  })}
                </span>
              )}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOtpDialogOpen(false)}
              disabled={verifyPhoneChange.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length < 6}
              isLoading={verifyPhoneChange.isPending}
            >
              {t("dashboard.settings.profile.otpVerify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.profile.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.profile.deleteConfirmDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => setDeleteConfirmDialogOpen(false)}
              disabled={requestDeletionOtp.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="w-full whitespace-nowrap sm:flex-1"
              onClick={handleConfirmStartDelete}
              isLoading={requestDeletionOtp.isPending}
            >
              {t("dashboard.settings.profile.deleteConfirmContinue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOtpDialogOpen} onOpenChange={setDeleteOtpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.profile.deleteOtpTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.profile.deleteOtpDescription", {
                phone: formatPhoneForDisplay(profile?.phone || user?.phone || ""),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={deleteOtpCode}
              onChange={setDeleteOtpCode}
              disabled={deleteAccount.isPending}
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

            {deleteOtpError && <p className="text-destructive text-sm">{deleteOtpError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => setDeleteOtpDialogOpen(false)}
              disabled={deleteAccount.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="w-full whitespace-nowrap sm:flex-1"
              onClick={handleConfirmDelete}
              disabled={deleteOtpCode.length < 6}
              isLoading={deleteAccount.isPending}
            >
              {t("dashboard.settings.profile.deleteConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettingsPage;
