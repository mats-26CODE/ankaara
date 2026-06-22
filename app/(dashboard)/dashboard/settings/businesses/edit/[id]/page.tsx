"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBusinesses, useUpdateBusiness } from "@/hooks/use-businesses";
import { useCurrencies } from "@/hooks/use-currencies";
import {
  uploadBusinessLogo,
  removeBusinessLogo,
  validateBusinessLogoFile,
} from "@/lib/storage/business-logo";
import { addCountryCode, formatPhoneForDisplay, clampPhoneDigitInput } from "@/helpers/helpers";
import { ToastAlert } from "@/config/toast";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ImageIcon, Type, Upload, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useStaffPermissions } from "@/hooks/use-staff-permissions";
import Image from "next/image";

type LogoMode = "image" | "text";

type FormState = {
  name: string;
  currency: string;
  address: string;
  tax_number: string;
  capacity: string;
  phone: string;
  second_phone: string;
  send_sale_alert: boolean;
  logo_mode: LogoMode;
  logo_url: string;
  logo_text: string;
  brand_color: string;
};

const emptyForm: FormState = {
  name: "",
  currency: "TZS",
  address: "",
  tax_number: "",
  capacity: "",
  phone: "",
  second_phone: "",
  send_sale_alert: false,
  logo_mode: "text",
  logo_url: "",
  logo_text: "",
  brand_color: "",
};

const toStored255Digits = (raw: string): string | null => {
  const t = raw.trim();
  if (!t) return null;
  const digits = addCountryCode(t).replace(/\D/g, "");
  if (!/^255\d{9}$/.test(digits)) return null;
  return digits;
};

const normalizePhonesForSave = (
  phoneTrim: string,
  secondTrim: string,
): {
  phone: string | null;
  second_phone: string | null;
  errorKey?: "phoneInvalid" | "secondPhoneInvalid";
} => {
  const phoneStored = phoneTrim ? toStored255Digits(phoneTrim) : null;
  const secondStored = secondTrim ? toStored255Digits(secondTrim) : null;
  if (phoneTrim && !phoneStored) {
    return {
      phone: null,
      second_phone: null,
      errorKey: "phoneInvalid",
    };
  }
  if (secondTrim && !secondStored) {
    return {
      phone: null,
      second_phone: null,
      errorKey: "secondPhoneInvalid",
    };
  }
  let secondOut = secondStored;
  if (phoneStored && secondStored && phoneStored === secondStored) {
    secondOut = null;
  }
  return { phone: phoneStored, second_phone: secondOut };
};

const EditBusinessPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const id = useRouteUuidParam("id");

  const { businesses, loading, refetch } = useBusinesses();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateBusiness = useUpdateBusiness();
  const permissions = useStaffPermissions();
  const canEditBusiness =
    permissions.isOwner || permissions.can("business_settings", "edit");

  const business = id ? (businesses.find((b) => b.id === id) ?? null) : null;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [prefilled, setPrefilled] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saleSmsDialog, setSaleSmsDialog] = useState<"enable" | "disable" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !canEditBusiness) {
      router.replace("/dashboard/settings/businesses");
    }
  }, [canEditBusiness, loading, router]);

  useEffect(() => {
    if (!business || prefilled) return;
    setForm({
      name: business.name || "",
      currency: business.currency || "TZS",
      address: business.address || "",
      tax_number: business.tax_number || "",
      capacity: business.capacity || "",
      phone: business.phone ? clampPhoneDigitInput(formatPhoneForDisplay(business.phone)) : "",
      second_phone: business.second_phone
        ? clampPhoneDigitInput(formatPhoneForDisplay(business.second_phone))
        : "",
      send_sale_alert: business.send_sale_alert ?? false,
      logo_mode: business.logo_url ? "image" : "text",
      logo_url: business.logo_url || "",
      logo_text: business.logo_text || "",
      brand_color: business.brand_color || "",
    });
    setPrefilled(true);
  }, [business, prefilled]);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    e.target.value = "";

    setLogoError(null);
    const validation = validateBusinessLogoFile(file);
    if (!validation.ok) {
      setLogoError(validation.error);
      ToastAlert.error(validation.error);
      return;
    }

    setLogoUploading(true);
    try {
      const url = await uploadBusinessLogo(file, business.id);
      setForm((p) => ({ ...p, logo_url: url }));
      await updateBusiness.mutateAsync({ id: business.id, logo_url: url });
      refetch();
      ToastAlert.success(t("dashboard.toast.logoUploaded"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("dashboard.toast.logoUploadFailed");
      setLogoError(message);
      ToastAlert.error(message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!business) return;
    setLogoError(null);
    setForm((p) => ({ ...p, logo_url: "" }));
    try {
      await removeBusinessLogo(business.id);
      await updateBusiness.mutateAsync({
        id: business.id,
        logo_url: null,
      });
      refetch();
      ToastAlert.success(t("dashboard.toast.logoRemoved"));
    } catch (err) {
      ToastAlert.error(err instanceof Error ? err.message : t("dashboard.toast.logoRemoveFailed"));
    }
  };

  const handleSubmit = () => {
    if (!business || !form.name.trim()) return;

    const phoneTrim = form.phone.trim();
    const secondTrim = form.second_phone.trim();
    if (form.send_sale_alert && !phoneTrim && !secondTrim) {
      ToastAlert.error(t("dashboard.settings.businesses.validation.phoneRequiredForAlerts"));
      return;
    }

    const normalized = normalizePhonesForSave(phoneTrim, secondTrim);
    if (normalized.errorKey) {
      ToastAlert.error(t(`dashboard.settings.businesses.validation.${normalized.errorKey}`));
      return;
    }

    const { phone: phoneStored, second_phone: secondPhoneOut } = normalized;

    // Persist both logo_url and logo_text; editing one must not clear the other
    const logoUrl = form.logo_url.trim() || null;
    const logoText = form.logo_text.trim() || null;

    updateBusiness.mutate(
      {
        id: business.id,
        name: form.name.trim(),
        currency: form.currency,
        address: form.address.trim() || null,
        tax_number: form.tax_number.trim() || null,
        capacity: form.capacity.trim() || null,
        phone: phoneStored,
        second_phone: secondPhoneOut,
        send_sale_alert: form.send_sale_alert,
        logo_url: logoUrl,
        logo_text: logoText,
        brand_color: form.brand_color.trim() || null,
      },
      {
        onSuccess: () => {
          refetch();
          router.push("/dashboard/settings/businesses");
        },
      },
    );
  };

  const persistSaleSmsEnable = async () => {
    if (!business) return;
    const phoneTrim = form.phone.trim();
    const secondTrim = form.second_phone.trim();
    if (!phoneTrim && !secondTrim) {
      ToastAlert.error(t("dashboard.settings.businesses.validation.phoneRequiredFirst"));
      return;
    }
    const normalized = normalizePhonesForSave(phoneTrim, secondTrim);
    if (normalized.errorKey) {
      ToastAlert.error(t(`dashboard.settings.businesses.validation.${normalized.errorKey}`));
      return;
    }
    const { phone: phoneStored, second_phone: secondPhoneOut } = normalized;
    try {
      const data = await updateBusiness.mutateAsync({
        id: business.id,
        phone: phoneStored,
        second_phone: secondPhoneOut,
        send_sale_alert: true,
      });
      setForm((p) => ({
        ...p,
        send_sale_alert: data.send_sale_alert,
        phone: data.phone ? clampPhoneDigitInput(formatPhoneForDisplay(data.phone)) : "",
        second_phone: data.second_phone
          ? clampPhoneDigitInput(formatPhoneForDisplay(data.second_phone))
          : "",
      }));
      await refetch();
      setSaleSmsDialog(null);
    } catch {
      // Toast from useUpdateBusiness onError
    }
  };

  const persistSaleSmsDisable = async () => {
    if (!business) return;
    try {
      const data = await updateBusiness.mutateAsync({ id: business.id, send_sale_alert: false });
      setForm((p) => ({ ...p, send_sale_alert: data.send_sale_alert }));
      await refetch();
      setSaleSmsDialog(null);
    } catch {
      // Toast from useUpdateBusiness onError
    }
  };

  if (loading || currenciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!id || !business) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings/businesses">
            <ArrowLeft className="mr-1 size-4" />
            {t("dashboard.common.backToBusinesses")}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {t("dashboard.settings.businesses.edit.notFound")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMutating = updateBusiness.isPending;
  const hasSaleSmsPhoneInput = !!(form.phone.trim() || form.second_phone.trim());
  const saleSmsSwitchDisabled = !form.send_sale_alert && !hasSaleSmsPhoneInput;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.businesses.edit.title")}</CardTitle>
          <CardDescription>{t("dashboard.settings.businesses.edit.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">{t("dashboard.common.name")} *</Label>
            <Input
              id="biz-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("dashboard.settings.businesses.form.namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
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
                    {c.code} — {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-address">{t("dashboard.common.address")}</Label>
            <Input
              id="biz-address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder={t("dashboard.settings.businesses.form.addressPlaceholder")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz-tax">
                {t("dashboard.settings.businesses.details.fieldTaxNumber")}
              </Label>
              <Input
                id="biz-tax"
                value={form.tax_number}
                onChange={(e) => setForm((p) => ({ ...p, tax_number: e.target.value }))}
                placeholder={t("dashboard.settings.businesses.form.taxNumberPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-capacity">Capacity</Label>
              <Input
                id="biz-capacity"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                placeholder={t("dashboard.settings.businesses.form.capacityPlaceholder")}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">
                {t("dashboard.settings.businesses.sms.sectionTitle")}
              </h3>
              <p className="text-muted-foreground text-xs">
                Enter your business phone numbers. We will use these to send{" "}
                {t("dashboard.settings.businesses.sms.sectionTitle")}.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="biz-phone">
                  {t("dashboard.settings.businesses.sms.phoneLabel")}
                </Label>
                <Input
                  id="biz-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: clampPhoneDigitInput(e.target.value) }))
                  }
                  placeholder={t("dashboard.settings.businesses.sms.phonePlaceholder")}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-second-phone">
                  {t("dashboard.settings.businesses.sms.secondPhoneLabel")}
                </Label>
                <Input
                  id="biz-second-phone"
                  value={form.second_phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, second_phone: clampPhoneDigitInput(e.target.value) }))
                  }
                  placeholder={t("dashboard.settings.businesses.sms.phonePlaceholder")}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor="biz-sale-sms" className="text-sm font-medium">
                  {t("dashboard.settings.businesses.sms.saleAlertsLabel")}
                </Label>
                <p className="text-muted-foreground text-xs">
                  Turning alerts on or off saves immediately. Add at least one phone before you can
                  turn alerts on.
                </p>
              </div>
              <Switch
                id="biz-sale-sms"
                checked={form.send_sale_alert}
                disabled={saleSmsSwitchDisabled || isMutating}
                title={
                  saleSmsSwitchDisabled && !form.send_sale_alert
                    ? t("dashboard.settings.businesses.sms.enableTooltip")
                    : undefined
                }
                onCheckedChange={(checked) => {
                  if (checked) setSaleSmsDialog("enable");
                  else setSaleSmsDialog("disable");
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Logo */}
          <div className="space-y-3">
            <Label>Logo</Label>
            {(form.logo_url || form.logo_text) && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {t("dashboard.settings.businesses.form.logoPreviewOnInvoices")}
                </p>

                <div className="flex items-center gap-2">
                  {form.logo_text && (
                    <div className="bg-muted/30 flex min-h-10 items-center rounded-md border px-4 py-3.5">
                      <span className="text-lg font-bold">{form.logo_text}</span>
                    </div>
                  )}
                  {form.logo_url && (
                    <div className="bg-muted/30 relative flex h-14 w-40 items-center justify-center rounded-md border">
                      <Image
                        src={form.logo_url}
                        alt="Logo"
                        fill
                        className="object-contain px-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, logo_mode: "text" }))}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.logo_mode === "text"
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Type className="size-3.5" /> Text Logo
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, logo_mode: "image" }))}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.logo_mode === "image"
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:border-primary/40"
                }`}
              >
                <ImageIcon className="size-3.5" /> Upload image
              </button>
            </div>

            {form.logo_mode === "text" ? (
              <div className="space-y-2">
                <Input
                  value={form.logo_text}
                  onChange={(e) => setForm((p) => ({ ...p, logo_text: e.target.value }))}
                  placeholder={t("dashboard.settings.businesses.form.logoTextPlaceholder")}
                />
                {form.logo_text && (
                  <div className="bg-muted/30 rounded-md border px-4 py-3">
                    <p className="text-lg font-bold">{form.logo_text}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoFileChange}
                  disabled={logoUploading || !business}
                />
                <p className="text-muted-foreground text-xs">
                  {t("dashboard.settings.businesses.form.logoUploadHint")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading || !business}
                  >
                    {logoUploading ? (
                      <>
                        <Spinner className="mr-1.5 size-3.5" />
                        {t("dashboard.settings.businesses.form.uploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 size-3.5" />
                        {t("dashboard.settings.businesses.form.chooseImage")}
                      </>
                    )}
                  </Button>
                  {form.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={logoUploading}
                      className="text-muted-foreground"
                    >
                      <X className="mr-1.5 size-3.5" />
                      {t("dashboard.settings.businesses.form.removeLogo")}
                    </Button>
                  )}
                </div>
                {logoError && <p className="text-destructive text-sm">{logoError}</p>}
                {form.logo_url && (
                  <div className="bg-muted/30 flex items-center justify-center rounded-md border px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt={t("dashboard.settings.businesses.form.logoPreviewAlt")}
                      className="h-10 w-auto max-w-[200px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* {t("dashboard.common.accentColor")} */}
          <div className="space-y-2">
            <Label htmlFor="biz-brand-color">{t("dashboard.common.accentColor")}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="biz-brand-color"
                value={form.brand_color || "#2563eb"}
                onChange={(e) => setForm((p) => ({ ...p, brand_color: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded border p-0.5"
              />
              <Input
                value={form.brand_color}
                onChange={(e) => setForm((p) => ({ ...p, brand_color: e.target.value }))}
                placeholder="#2563eb"
                className="flex-1"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("dashboard.settings.businesses.form.brandColorHint")}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" asChild disabled={isMutating}>
              <Link href="/dashboard/settings/businesses">{t("dashboard.common.cancel")}</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} isLoading={isMutating}>
              {t("dashboard.common.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={saleSmsDialog !== null}
        onOpenChange={(open) => !open && setSaleSmsDialog(null)}
      >
        <DialogContent showCloseButton className="sm:max-w-md">
          {saleSmsDialog === "enable" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("dashboard.settings.businesses.sms.enableDialogTitle")}
                </DialogTitle>
                <DialogDescription>
                  You are opting in to SMS when a sale is recorded for this business. This saves
                  now. Messages use the phone numbers entered above (valid Tanzanian mobiles).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaleSmsDialog(null)}
                  disabled={isMutating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void persistSaleSmsEnable()}
                  isLoading={isMutating}
                >
                  {t("dashboard.settings.businesses.sms.enableConfirm")}
                </Button>
              </DialogFooter>
            </>
          )}
          {saleSmsDialog === "disable" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t("dashboard.settings.businesses.sms.disableDialogTitle")}
                </DialogTitle>
                <DialogDescription>
                  You will no longer receive {t("dashboard.settings.businesses.sms.sectionTitle")}{" "}
                  when sales are recorded for this business. This saves now.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaleSmsDialog(null)}
                  disabled={isMutating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void persistSaleSmsDisable()}
                  isLoading={isMutating}
                >
                  {t("dashboard.settings.businesses.sms.disableConfirm")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditBusinessPage;
