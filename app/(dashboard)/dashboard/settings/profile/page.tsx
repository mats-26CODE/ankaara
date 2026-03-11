"use client";

import { useState, useEffect } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { useCurrencies } from "@/hooks/use-currencies";
import { useBusinesses, useUpdateBusiness, type Business } from "@/hooks/use-businesses";
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
import { ImageIcon, Type } from "lucide-react";

const ProfileSettingsPage = () => {
  const { user } = useUser();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const { businesses, loading: bizLoading, refetch: refetchBiz } = useBusinesses();
  const updateBusiness = useUpdateBusiness();
  const myBusiness: Business | undefined = businesses[0];

  const sendOtp = useSendOtpForOnboarding();
  const verifyOtp = useVerifyOtpForOnboarding();
  const { countdown, canResend, startCountdown } = useOtpCountdown(60);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    preferred_currency: "TZS",
  });

  type BizLogoMode = "image" | "text";
  const [bizForm, setBizForm] = useState({
    name: "",
    address: "",
    tax_number: "",
    logo_mode: "text" as BizLogoMode,
    logo_url: "",
    logo_text: "",
    brand_color: "",
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
    if (myBusiness) {
      setBizForm({
        name: myBusiness.name || "",
        address: myBusiness.address || "",
        tax_number: myBusiness.tax_number || "",
        logo_mode: myBusiness.logo_url ? "image" : "text",
        logo_url: myBusiness.logo_url || "",
        logo_text: myBusiness.logo_text || "",
        brand_color: myBusiness.brand_color || "",
      });
    }
    setPrefilled(true);
  }, [profile, myBusiness, prefilled]);

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

  const handleSaveBusiness = () => {
    if (!myBusiness) return;
    updateBusiness.mutate(
      {
        id: myBusiness.id,
        name: bizForm.name.trim() || myBusiness.name,
        address: bizForm.address.trim() || null,
        tax_number: bizForm.tax_number.trim() || null,
        logo_url: bizForm.logo_mode === "image" ? bizForm.logo_url.trim() || null : null,
        logo_text: bizForm.logo_mode === "text" ? bizForm.logo_text.trim() || null : null,
        brand_color: bizForm.brand_color.trim() || null,
      },
      { onSuccess: () => refetchBiz() }
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

  if (profileLoading || currenciesLoading || bizLoading) {
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

      {/* Business Details — for individual accounts (or any account with a business) */}
      {myBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>
              Logo, address, and branding shown on your invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="biz-name">Business Name</Label>
                <Input
                  id="biz-name"
                  value={bizForm.name}
                  onChange={(e) => setBizForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-address">Address</Label>
                <Input
                  id="biz-address"
                  value={bizForm.address}
                  onChange={(e) => setBizForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Business address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-tax">TIN / VAT Number</Label>
                <Input
                  id="biz-tax"
                  value={bizForm.tax_number}
                  onChange={(e) => setBizForm((p) => ({ ...p, tax_number: e.target.value }))}
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            <Separator />

            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBizForm((p) => ({ ...p, logo_mode: "text" }))}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    bizForm.logo_mode === "text" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Type className="size-3.5" /> Text Logo
                </button>
                <button
                  type="button"
                  onClick={() => setBizForm((p) => ({ ...p, logo_mode: "image" }))}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    bizForm.logo_mode === "image" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <ImageIcon className="size-3.5" /> Image URL
                </button>
              </div>

              {bizForm.logo_mode === "text" ? (
                <div className="space-y-2">
                  <Input
                    value={bizForm.logo_text}
                    onChange={(e) => setBizForm((p) => ({ ...p, logo_text: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                  />
                  {bizForm.logo_text && (
                    <div className="rounded-md border bg-muted/30 px-4 py-3">
                      <p className="text-lg font-bold">{bizForm.logo_text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={bizForm.logo_url}
                    onChange={(e) => setBizForm((p) => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                  {bizForm.logo_url && (
                    <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bizForm.logo_url}
                        alt="Logo preview"
                        className="h-10 w-auto max-w-[200px] object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <Label htmlFor="biz-brand-color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="biz-brand-color"
                  value={bizForm.brand_color || "#2563eb"}
                  onChange={(e) => setBizForm((p) => ({ ...p, brand_color: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border p-0.5"
                />
                <Input
                  value={bizForm.brand_color}
                  onChange={(e) => setBizForm((p) => ({ ...p, brand_color: e.target.value }))}
                  placeholder="#2563eb"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used as the accent on your invoice templates
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBusiness} isLoading={updateBusiness.isPending}>
                Save Business Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
