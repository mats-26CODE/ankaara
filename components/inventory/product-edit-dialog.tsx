"use client";

import { useEffect, useState } from "react";
import {
  useUpdateProduct,
  type Product,
  type ProductItemType,
} from "@/hooks/use-products";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = {
  name: string;
  description: string;
  item_type: ProductItemType;
  base_price: string;
  selling_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  unit: string;
  sku: string;
};

const formatPriceDisplay = (val: string): string => {
  if (val === "" || val === ".") return val;
  const n = Number(val.replace(/,/g, ""));
  return Number.isNaN(n) ? val : n.toLocaleString();
};

const parsePriceInput = (raw: string): string => {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIdx = cleaned.indexOf(".");
  if (dotIdx === -1) return cleaned;
  const int = cleaned.slice(0, dotIdx);
  const dec = cleaned
    .slice(dotIdx + 1)
    .replace(/\D/g, "")
    .slice(0, 2);
  return dec ? `${int}.${dec}` : int || ".";
};

const productToFormState = (product: Product): FormState => ({
  name: product.name || "",
  description: product.description || "",
  item_type: (product.item_type as ProductItemType) || "product",
  base_price: String(product.base_price ?? ""),
  selling_price: String(product.selling_price ?? product.unit_price ?? ""),
  stock_quantity: String(product.stock_quantity ?? ""),
  low_stock_threshold:
    product.low_stock_threshold == null ? "" : String(product.low_stock_threshold),
  unit: product.unit || "",
  sku: product.sku || "",
});

type ProductEditDialogProps = {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  businessName?: string | null;
};

export const ProductEditDialog = ({
  product,
  open,
  onOpenChange,
  onSuccess,
  businessName,
}: ProductEditDialogProps) => {
  const { t } = useTranslation();
  const updateProduct = useUpdateProduct();
  const [form, setForm] = useState<FormState>(() => productToFormState(product));

  useEffect(() => {
    if (open) {
      setForm(productToFormState(product));
    }
  }, [open, product]);

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const itemType = form.item_type;
    const basePrice = Number(form.base_price);
    const sellingPrice = Number(form.selling_price);
    const stockQuantity = Number(form.stock_quantity);
    const lowStockThreshold = Number(form.low_stock_threshold);
    if (
      Number.isNaN(basePrice) ||
      Number.isNaN(sellingPrice) ||
      basePrice < 0 ||
      sellingPrice < basePrice
    ) {
      return;
    }

    updateProduct.mutate(
      {
        id: product.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        item_type: itemType,
        base_price: basePrice,
        selling_price: sellingPrice,
        unit_price: sellingPrice,
        unit: form.unit.trim() || null,
        sku: form.sku.trim() || null,
        stock_quantity:
          itemType === "service" ? 0 : Number.isNaN(stockQuantity) ? 0 : Math.max(0, stockQuantity),
        low_stock_threshold:
          itemType === "service" || Number.isNaN(lowStockThreshold)
            ? null
            : Math.max(0, lowStockThreshold),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  const sellingBelowBase = Number(form.selling_price || 0) < Number(form.base_price || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("dashboard.common.editProduct")}</DialogTitle>
          <DialogDescription className="flex flex-col gap-2">
            {t("dashboard.common.editProductDialogDescription")}
            {businessName ? (
              <span className="flex items-center gap-2">
                {t("dashboard.common.businessLabel")}{" "}
                <Badge variant="secondary" className="font-normal">
                  {businessName}
                </Badge>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2 pr-1">
          <div className="space-y-2">
            <Label>{t("dashboard.common.itemType")}</Label>
            <Select
              value={form.item_type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, item_type: value as ProductItemType }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("dashboard.common.selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">{t("dashboard.common.product")}</SelectItem>
                <SelectItem value="service">{t("dashboard.common.service")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-name">{t("dashboard.common.name")} *</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("dashboard.inventory.productEdit.namePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-desc">{t("dashboard.common.description")}</Label>
            <Textarea
              id="product-desc"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("dashboard.inventory.productEdit.descriptionPlaceholder")}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-base-price">{t("dashboard.common.basePrice")} *</Label>
              <Input
                id="product-base-price"
                inputMode="decimal"
                value={formatPriceDisplay(form.base_price)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, base_price: parsePriceInput(e.target.value) }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-selling-price">{t("dashboard.common.sellingPrice")} *</Label>
              <Input
                id="product-selling-price"
                inputMode="decimal"
                value={formatPriceDisplay(form.selling_price)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, selling_price: parsePriceInput(e.target.value) }))
                }
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-unit">{t("dashboard.common.unit")}</Label>
              <Input
                id="product-unit"
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder={t("dashboard.inventory.productEdit.unitPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-sku">{t("dashboard.common.sku")}</Label>
              <Input
                id="product-sku"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder={t("dashboard.inventory.productEdit.skuPlaceholder")}
              />
            </div>
          </div>
          {form.item_type === "product" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-stock">{t("dashboard.common.currentStock")}</Label>
                <Input
                  id="product-stock"
                  inputMode="decimal"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      stock_quantity: e.target.value.replace(/[^\d.-]/g, ""),
                    }))
                  }
                  placeholder="0"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-low-stock">{t("dashboard.common.lowStockAlert")}</Label>
                <Input
                  id="product-low-stock"
                  inputMode="decimal"
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      low_stock_threshold: e.target.value.replace(/[^\d.]/g, ""),
                    }))
                  }
                  placeholder={t("dashboard.inventory.productEdit.skuPlaceholder")}
                />
              </div>
            </div>
          )}
          {sellingBelowBase ? (
            <p className="text-destructive text-sm">{t("dashboard.common.sellingBelowBaseError")}</p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateProduct.isPending}>
            {t("dashboard.common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              !form.selling_price.trim() ||
              sellingBelowBase ||
              updateProduct.isPending
            }
            isLoading={updateProduct.isPending}
          >
            {t("dashboard.common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
