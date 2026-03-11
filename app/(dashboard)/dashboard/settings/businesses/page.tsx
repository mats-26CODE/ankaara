"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useBusinesses,
  useCreateBusiness,
  useUpdateBusiness,
  useDeleteBusiness,
  type Business,
  type CreateBusinessPayload,
} from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useProfile } from "@/hooks/use-profile";
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
import { Plus, Pencil, Trash2, Check } from "lucide-react";

type FormState = {
  name: string;
  currency: string;
  address: string;
  tax_number: string;
  capacity: string;
};

const emptyForm: FormState = {
  name: "",
  currency: "TZS",
  address: "",
  tax_number: "",
  capacity: "",
};

const BusinessesSettingsPage = () => {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { businesses, loading, refetch } = useBusinesses();
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const deleteBusiness = useDeleteBusiness();

  const isBusinessAccount = profile?.account_type === "business";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!profileLoading && profile && !isBusinessAccount) {
      router.replace("/dashboard/settings/profile");
    }
  }, [profileLoading, profile, isBusinessAccount, router]);

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
    });
    setDialogOpen(true);
  };

  const openDelete = (biz: Business) => {
    setDeletingBusiness(biz);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    if (editingBusiness) {
      updateBusiness.mutate(
        {
          id: editingBusiness.id,
          name: form.name.trim(),
          currency: form.currency,
          address: form.address.trim() || null,
          tax_number: form.tax_number.trim() || null,
          capacity: form.capacity.trim() || null,
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

  if (loading || currenciesLoading || profileLoading || !isBusinessAccount) {
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
            <CardTitle>
              {isBusinessAccount ? "Your Businesses" : "Your Business"}
            </CardTitle>
            <CardDescription>
              {isBusinessAccount
                ? "Manage your business outlets. Clients and invoices are scoped to the active business."
                : "Manage your business details. Upgrade to a Business account to create multiple outlets."}
            </CardDescription>
          </div>
          {isBusinessAccount && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1" />
              Add Business
            </Button>
          )}
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
                      {isBusinessAccount && (
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
                      )}
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating || !form.name.trim()}>
              {isMutating ? (
                <Spinner className="size-4" />
              ) : editingBusiness ? (
                "Save"
              ) : (
                "Create"
              )}
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
              disabled={deleteBusiness.isPending}
            >
              {deleteBusiness.isPending ? (
                <Spinner className="size-4" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessesSettingsPage;
