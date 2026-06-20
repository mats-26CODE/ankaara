"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  useBusinesses,
  useCreateBusiness,
  useUpdateBusiness,
  useDeleteBusiness,
  type Business,
  type CreateBusinessPayload,
} from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useCurrencies } from "@/hooks/use-currencies";
import { uploadBusinessLogo, validateBusinessLogoFile } from "@/lib/storage/business-logo";
import { ToastAlert } from "@/config/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Check, ImageIcon, Type, Upload, X } from "lucide-react";
import Image from "next/image";

type LogoMode = "image" | "text";

type FormState = {
  name: string;
  currency: string;
  address: string;
  tax_number: string;
  capacity: string;
  logo_mode: LogoMode;
  logo_url: string;
  logo_text: string;
  brand_color: string;
  is_primary: boolean;
};

const emptyForm: FormState = {
  name: "",
  currency: "TZS",
  address: "",
  tax_number: "",
  capacity: "",
  logo_mode: "text",
  logo_url: "",
  logo_text: "",
  brand_color: "",
  is_primary: true,
};

const BusinessesSettingsPage = () => {
  const { t } = useTranslation();
  const { businesses, loading, refetch } = useBusinesses();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first business if none selected
  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const openCreate = () => {
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoError(null);
    setDialogOpen(true);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setLogoError(null);
    if (!file) {
      setLogoFile(null);
      setLogoPreviewUrl(null);
      return;
    }
    const validation = validateBusinessLogoFile(file);
    if (!validation.ok) {
      setLogoError(validation.error);
      ToastAlert.error(validation.error);
      return;
    }
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const clearLogoFile = () => {
    setLogoFile(null);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoPreviewUrl(null);
    setLogoError(null);
  };

  const openDelete = (biz: Business) => {
    setDeletingBusiness(biz);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const logoText = form.logo_mode === "text" ? form.logo_text.trim() || null : null;
    const payload: CreateBusinessPayload = {
      name: form.name.trim(),
      currency: form.currency,
      address: form.address.trim() || undefined,
      tax_number: form.tax_number.trim() || undefined,
      capacity: form.capacity.trim() || undefined,
      logo_url: undefined,
      logo_text: logoText || undefined,
      brand_color: form.brand_color.trim() || undefined,
      is_primary: form.is_primary,
    };

    createBusiness.mutate(payload, {
      onSuccess: async (newBiz) => {
        if (newBiz && form.logo_mode === "image" && logoFile) {
          try {
            const url = await uploadBusinessLogo(logoFile, newBiz.id);
            await updateBusiness.mutateAsync({
              id: newBiz.id,
              logo_url: url,
            });
          } catch (err) {
            ToastAlert.error(
              err instanceof Error ? err.message : t("dashboard.toast.logoUploadFailed"),
            );
          }
        }
        setDialogOpen(false);
        refetch();
        if (!currentBusinessId && newBiz) {
          setCurrentBusiness(newBiz.id);
        }
      },
    });
  };

  const handleMakePrimary = (biz: Business) => {
    if (biz.is_primary) return;
    updateBusiness.mutate(
      { id: biz.id, is_primary: true },
      {
        onSuccess: () => {
          setCurrentBusiness(biz.id);
          refetch();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deletingBusiness) return;
    deleteBusiness.mutate(deletingBusiness.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingBusiness(null);
        if (currentBusinessId === deletingBusiness.id) {
          const remaining = businesses.filter((b) => b.id !== deletingBusiness.id);
          const fallbackBusiness =
            remaining.find((business) => business.is_primary) ?? remaining[0];
          setCurrentBusiness(fallbackBusiness?.id || null);
        }
        refetch();
      },
    });
  };

  const isMutating =
    createBusiness.isPending || updateBusiness.isPending || deleteBusiness.isPending;

  if (loading || currenciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  const activeBusiness =
    businesses.find((b) => b.id === currentBusinessId) ?? businesses[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("dashboard.settings.businesses.list.title")}</CardTitle>
            <CardDescription>
              {t("dashboard.settings.businesses.list.description")}
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="mr-1 size-4" />
            {t("dashboard.settings.businesses.list.addBusiness")}
          </Button>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("dashboard.settings.businesses.list.empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {businesses.map((biz) => {
                const isActive = biz.id === currentBusinessId;
                return (
                  <div
                    key={biz.id}
                    className="hover:bg-muted/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentBusiness(biz.id)}
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:mt-0 ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-primary/50"
                        }`}
                        title={isActive ? t("dashboard.settings.businesses.list.activeTooltip") : t("dashboard.settings.businesses.list.setActiveTooltip")}
                      >
                        {isActive && <Check className="size-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                          <p className="font-medium leading-snug wrap-break-word sm:min-w-0 sm:truncate sm:leading-none">
                            {biz.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                            {isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                            {biz.is_primary && (
                              <Badge variant="outline" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs wrap-break-word sm:mt-1 sm:truncate">
                          {[biz.currency, biz.address].filter(Boolean).join(" · ") || t("dashboard.settings.businesses.list.noDetails")}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 border-t pt-3 sm:ml-2 sm:border-t-0 sm:pt-0">
                      {!biz.is_primary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMakePrimary(biz)}
                          disabled={isMutating}
                          title={t("dashboard.settings.businesses.list.makePrimaryTooltip")}
                        >
                          {t("dashboard.settings.businesses.list.makePrimary")}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild title={t("dashboard.settings.businesses.list.editTooltip")}>
                        <Link href={`/dashboard/settings/businesses/edit/${biz.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(biz)}
                        disabled={businesses.length <= 1}
                        title={
                          businesses.length <= 1
                            ? t("dashboard.settings.businesses.list.deleteOnlyBusinessTooltip")
                            : t("dashboard.settings.businesses.list.deleteTooltip")
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {activeBusiness && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.settings.businesses.details.title")}</CardTitle>
            <CardDescription>
              {t("dashboard.settings.businesses.details.description", { name: activeBusiness.name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.common.name")}</p>
                <p>{activeBusiness.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.common.currency")}</p>
                <p>{activeBusiness.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.common.primary")}</p>
                <p>{activeBusiness.is_primary ? t("dashboard.common.yesVerified") : t("dashboard.common.no")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.common.address")}</p>
                <p>{activeBusiness.address || t("dashboard.common.notSet")}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase">
                    Tax number
                  </p>
                  <p>{activeBusiness.tax_number || t("dashboard.common.notSet")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.settings.businesses.details.fieldCapacity")}</p>
                  <p>{activeBusiness.capacity || t("dashboard.common.notSet")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-semibold uppercase">
                  {t("dashboard.settings.businesses.details.logoPreview")}
                </p>
                <div className="flex items-center gap-2">
                  {activeBusiness.logo_text && (
                    <div className="bg-muted/30 flex min-h-10 items-center rounded-md border px-4 py-3">
                      <span className="text-lg font-semibold">{activeBusiness.logo_text}</span>
                    </div>
                  )}
                  {activeBusiness.logo_url && (
                    <div className="bg-muted/30 relative flex h-14 w-40 items-center justify-center rounded-md border">
                      <Image
                        src={activeBusiness.logo_url}
                        alt={activeBusiness.name}
                        fill
                        className="object-contain px-1"
                      />
                    </div>
                  )}
                  {!activeBusiness.logo_url && !activeBusiness.logo_text && (
                    <div className="bg-muted/30 flex h-20 items-center justify-center rounded-md border px-4">
                      <span className="text-muted-foreground text-xs">{t("dashboard.settings.businesses.details.noLogoConfigured")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold uppercase">{t("dashboard.settings.businesses.details.brandColor")}</p>
                {activeBusiness.brand_color ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: activeBusiness.brand_color }}
                    />
                    <span className="text-sm">{activeBusiness.brand_color}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">Not set</p>
                )}
                <p className="text-muted-foreground text-xs">
                  {t("dashboard.settings.businesses.details.brandColorHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Business Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.businesses.create.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.businesses.create.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
              <Label>{t("dashboard.common.currency")}</Label>
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
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor="biz-primary">{t("dashboard.settings.businesses.form.primaryLabel")}</Label>
                <p className="text-muted-foreground text-xs">
                  {t("dashboard.settings.businesses.form.primaryHint")}
                </p>
              </div>
              <Switch
                id="biz-primary"
                checked={form.is_primary}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, is_primary: checked }))}
              />
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
                <Label htmlFor="biz-tax">{t("dashboard.settings.businesses.details.fieldTaxNumber")}</Label>
                <Input
                  id="biz-tax"
                  value={form.tax_number}
                  onChange={(e) => setForm((p) => ({ ...p, tax_number: e.target.value }))}
                  placeholder={t("dashboard.settings.businesses.form.taxNumberPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-capacity">{t("dashboard.settings.businesses.details.fieldCapacity")}</Label>
                <Input
                  id="biz-capacity"
                  value={form.capacity}
                  onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                  placeholder={t("dashboard.settings.businesses.form.capacityPlaceholder")}
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
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleLogoFileChange}
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
                    >
                      <Upload className="mr-1.5 size-3.5" />
                      {t("dashboard.settings.businesses.form.chooseImage")}
                    </Button>
                    {(logoFile || logoPreviewUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearLogoFile}
                        className="text-muted-foreground"
                      >
                        <X className="mr-1.5 size-3.5" />
                        {t("dashboard.settings.businesses.form.remove")}
                      </Button>
                    )}
                  </div>
                  {logoError && <p className="text-destructive text-sm">{logoError}</p>}
                  {logoPreviewUrl && (
                    <div className="bg-muted/30 flex items-center justify-center rounded-md border px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreviewUrl}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} isLoading={isMutating}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.settings.businesses.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.settings.businesses.delete.description", { name: deletingBusiness?.name ?? "" })}
              ? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteBusiness.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteBusiness.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessesSettingsPage;
