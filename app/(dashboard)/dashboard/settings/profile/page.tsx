"use client";

import { useState, useEffect } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { useCurrencies } from "@/hooks/use-currencies";
import { useTheme, useLanguage } from "@/lib/stores/preferences-store";
import {
  useSendOtpForOnboarding,
  useVerifyOtpForOnboarding,
} from "@/hooks/use-auth";
import { useOtpCountdown } from "@/hooks/use-otp-countdown";
import { addCountryCode } from "@/helpers/helpers";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const ProfileSettingsPage = () => {
  const { user } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const sendOtp = useSendOtpForOnboarding();
  const verifyOtp = useVerifyOtpForOnboarding();
  const { countdown, canResend, startCountdown } = useOtpCountdown(60);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    preferred_currency: "TZS",
  });

  const [prefilled, setPrefilled] = useState(false);

  // OTP dialog state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    if (prefilled || !profile) return;
    setForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      avatar_url: profile.avatar_url || "",
      preferred_currency: profile.preferred_currency || "TZS",
    });
    setPrefilled(true);
  }, [profile, prefilled]);

  const phoneChanged = () => {
    const newPhone = addCountryCode(form.phone.trim());
    const existingPhone = profile?.phone || "";
    return !!form.phone.trim() && newPhone !== existingPhone;
  };

  const handleSave = () => {
    if (phoneChanged()) {
      const formatted = addCountryCode(form.phone.trim());
      setPendingPhone(formatted);
      setOtpCode("");
      setOtpError(null);
      sendOtp.mutate(
        { phone: formatted },
        {
          onSuccess: () => {
            setOtpDialogOpen(true);
            startCountdown();
          },
        }
      );
      return;
    }

    saveProfile();
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
      }
    );
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 6) return;
    setOtpError(null);
    verifyOtp.mutate(
      { phone: pendingPhone, code: otpCode },
      {
        onSuccess: () => {
          setOtpDialogOpen(false);
          saveProfile(pendingPhone);
        },
        onError: (err) => {
          setOtpError(err.message || "Verification failed");
        },
      }
    );
  };

  const handleResendOtp = () => {
    if (!canResend) return;
    setOtpError(null);
    sendOtp.mutate(
      { phone: pendingPhone },
      { onSuccess: () => startCountdown() }
    );
  };

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

  const isSaving = updateProfile.isPending || sendOtp.isPending;

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={form.avatar_url || undefined} alt="Avatar" />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={form.avatar_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, avatar_url: e.target.value }))
                }
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="07XXXXXXXX"
              />
              {phoneChanged() && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Changing your phone will require OTP verification.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Currency</Label>
              <Select
                value={form.preferred_currency}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, preferred_currency: v }))
                }
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
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Appearance and language settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "sw")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Kiswahili</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            Theme and language are saved to your browser automatically.
          </div>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              We sent a verification code to <strong>{pendingPhone}</strong>.
              Enter it below to confirm your new phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otpCode}
              onChange={setOtpCode}
              disabled={verifyOtp.isPending}
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

            {otpError && (
              <p className="text-sm text-destructive">{otpError}</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendOtp.isPending}
                  className="text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {sendOtp.isPending ? "Sending..." : "Resend code"}
                </button>
              ) : (
                <span>Resend in {countdown}s</span>
              )}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOtpDialogOpen(false)}
              disabled={verifyOtp.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length < 6}
              isLoading={verifyOtp.isPending}
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSettingsPage;
