"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Check, ImageIcon, Type } from "lucide-react";

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

const BusinessesSettingsPage = () => {
  const { businesses, loading, refetch } = useBusinesses();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Auto-select first business if none selected
  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const openCreate = () => {
    setEditingBusiness(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (biz: Business) => {
    setEditingBusiness(biz);
    setForm({
      name: biz.name || "",
      currency: biz.currency || "TZS",
      address: biz.address || "",
      tax_number: biz.tax_number || "",
      capacity: biz.capacity || "",
      logo_mode: biz.logo_url ? "image" : "text",
      logo_url: biz.logo_url || "",
      logo_text: biz.logo_text || "",
      brand_color: biz.brand_color || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (biz: Business) => {
    setDeletingBusiness(biz);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const logoUrl = form.logo_mode === "image" ? form.logo_url.trim() || null : null;
    const logoText = form.logo_mode === "text" ? form.logo_text.trim() || null : null;

    if (editingBusiness) {
      updateBusiness.mutate(
        {
          id: editingBusiness.id,
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
            setDialogOpen(false);
            refetch();
          },
        }
      );
    } else {
      const payload: CreateBusinessPayload = {
        name: form.name.trim(),
        currency: form.currency,
        address: form.address.trim() || undefined,
        tax_number: form.tax_number.trim() || undefined,
        capacity: form.capacity.trim() || undefined,
        logo_url: logoUrl || undefined,
        logo_text: logoText || undefined,
        brand_color: form.brand_color.trim() || undefined,
      };
      createBusiness.mutate(payload, {
        onSuccess: (newBiz) => {
          setDialogOpen(false);
          refetch();
          if (!currentBusinessId && newBiz) {
            setCurrentBusiness(newBiz.id);
          }
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingBusiness) return;
    deleteBusiness.mutate(deletingBusiness.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingBusiness(null);
        if (currentBusinessId === deletingBusiness.id) {
          const remaining = businesses.filter((b) => b.id !== deletingBusiness.id);
          setCurrentBusiness(remaining[0]?.id || null);
        }
        refetch();
      },
    });
  };

  const isMutating =
    createBusiness.isPending ||
    updateBusiness.isPending ||
    deleteBusiness.isPending;

  if (loading || currenciesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Your Businesses</CardTitle>
            <CardDescription>
              Manage your businesses. Clients and invoices are scoped to the active business.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Add Business
          </Button>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No businesses yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {businesses.map((biz) => {
                const isActive = biz.id === currentBusinessId;
                return (
                  <div
                    key={biz.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setCurrentBusiness(biz.id)}
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-primary/50"
                        }`}
                        title={isActive ? "Active business" : "Set as active"}
                      >
                        {isActive && <Check className="size-4" />}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{biz.name}</p>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {[biz.currency, biz.address].filter(Boolean).join(" · ") ||
                            "No details"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(biz)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDelete(biz)}
                        disabled={businesses.length <= 1}
                        title={
                          businesses.length <= 1
                            ? "Cannot delete the only business"
                            : "Delete business"
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBusiness ? "Edit Business" : "Add Business"}
            </DialogTitle>
            <DialogDescription>
              {editingBusiness
                ? "Update your business details."
                : "Create a new business to manage clients and invoices."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tax_number: e.target.value }))
                  }
                  placeholder="TIN / VAT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-capacity">Capacity</Label>
                <Input
                  id="biz-capacity"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, capacity: e.target.value }))
                  }
                  placeholder="e.g. 1-10 employees"
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
                    form.logo_mode === "text" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Type className="size-3.5" /> Text Logo
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, logo_mode: "image" }))}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.logo_mode === "image" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <ImageIcon className="size-3.5" /> Image URL
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
                    <div className="rounded-md border bg-muted/30 px-4 py-3">
                      <p className="text-lg font-bold">{form.logo_text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={form.logo_url}
                    onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                  {form.logo_url && (
                    <div className="rounded-md border bg-muted/30 px-4 py-3 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.logo_url}
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
              <p className="text-xs text-muted-foreground">
                Used as the accent color on Bold Brand template invoices
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()} isLoading={isMutating}>
              {editingBusiness ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deletingBusiness?.name}</span>? This
              action cannot be undone.
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
