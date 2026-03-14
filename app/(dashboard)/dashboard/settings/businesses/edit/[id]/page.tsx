"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBusinesses, useUpdateBusiness } from "@/hooks/use-businesses";
import { useCurrencies } from "@/hooks/use-currencies";
import {
  uploadBusinessLogo,
  removeBusinessLogo,
  validateBusinessLogoFile,
} from "@/lib/storage/business-logo";
import { ToastAlert } from "@/config/toast";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, ImageIcon, Type, Upload, X } from "lucide-react";
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
};

const EditBusinessPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;

  const { businesses, loading, refetch } = useBusinesses();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateBusiness = useUpdateBusiness();

  const business = id ? (businesses.find((b) => b.id === id) ?? null) : null;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [prefilled, setPrefilled] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!business || prefilled) return;
    setForm({
      name: business.name || "",
      currency: business.currency || "TZS",
      address: business.address || "",
      tax_number: business.tax_number || "",
      capacity: business.capacity || "",
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
      ToastAlert.success("Logo uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
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
      ToastAlert.success("Logo removed");
    } catch (err) {
      ToastAlert.error(err instanceof Error ? err.message : "Could not remove logo");
    }
  };

  const handleSubmit = () => {
    if (!business || !form.name.trim()) return;

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
            Back to Businesses
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Business not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMutating = updateBusiness.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Business</CardTitle>
          <CardDescription>
            Update your business details. Changes apply to invoices and branding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business Name *</Label>
            <Input
              id="biz-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="My Business"
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
            <Label htmlFor="biz-address">Address</Label>
            <Input
              id="biz-address"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="Business address"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="biz-tax">Tax Number</Label>
              <Input
                id="biz-tax"
                value={form.tax_number}
                onChange={(e) => setForm((p) => ({ ...p, tax_number: e.target.value }))}
                placeholder="TIN / VAT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-capacity">Capacity</Label>
              <Input
                id="biz-capacity"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                placeholder="e.g. 1-10 employees"
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
                  Preview (as on invoices)
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
                  placeholder="e.g. Acme Corp"
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
                  JPEG, PNG, WebP or GIF. Max 1MB. Uploaded to your secure storage.
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
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 size-3.5" />
                        Choose image
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
                      Remove logo
                    </Button>
                  )}
                </div>
                {logoError && <p className="text-destructive text-sm">{logoError}</p>}
                {form.logo_url && (
                  <div className="bg-muted/30 flex items-center justify-center rounded-md border px-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
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

          {/* Brand Color */}
          <div className="space-y-2">
            <Label htmlFor="biz-brand-color">Brand Color</Label>
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
              Used as the accent color on Bold Brand template invoices
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" asChild disabled={isMutating}>
              <Link href="/dashboard/settings/businesses">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} isLoading={isMutating}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBusinessPage;
