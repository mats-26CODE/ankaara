"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useCreateProduct, type Product, type CreateProductPayload } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package } from "lucide-react";

const PAGE_SIZE = 20;

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

export type ProductLinePayload = {
  id: string;
  name: string;
  item_type: string;
  base_price: number;
  selling_price: number;
  stock_quantity: number;
  unit_price: number;
};

type ProductPickerDialogProps = {
  businessId: string | null;
  /** Optional business name shown in the "Add product" dialog (e.g. for context). */
  businessName?: string | null;
  products: Product[];
  refetchProducts: () => void;
  onAddLine: (product: ProductLinePayload) => void;
  /** When set, dialog is controlled by parent; no trigger buttons rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ProductPickerDialog = ({
  businessId,
  businessName,
  products,
  refetchProducts,
  onAddLine,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProductPickerDialogProps) => {
  const createProduct = useCreateProduct();

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOnOpenChange != null;
  const pickerOpen = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setPickerOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef<HTMLDivElement>(null);

  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    item_type: "product",
    base_price: "",
    selling_price: "",
    stock_quantity: "",
    unit: "",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const handleSelect = (product: Product) => {
    onAddLine({
      id: product.id,
      name: product.name,
      item_type: product.item_type,
      base_price: Number(product.base_price),
      selling_price: Number(product.selling_price),
      stock_quantity: Number(product.stock_quantity),
      unit_price: Number(product.selling_price),
    });
    setPickerOpen(false);
    setSearch("");
  };

  const resetAddForm = () => {
    setAddForm({
      name: "",
      description: "",
      item_type: "product",
      base_price: "",
      selling_price: "",
      stock_quantity: "",
      unit: "",
    });
  };

  const handleAddProduct = () => {
    if (!addForm.name.trim() || !businessId) return;
    const basePrice = Number(addForm.base_price);
    const sellingPrice = Number(addForm.selling_price);
    const stockQuantity = Number(addForm.stock_quantity);
    const payload: CreateProductPayload = {
      business_id: businessId,
      name: addForm.name.trim(),
      description: addForm.description.trim() || undefined,
      item_type: addForm.item_type as "product" | "service",
      base_price: Number.isNaN(basePrice) ? 0 : basePrice,
      selling_price: Number.isNaN(sellingPrice) ? 0 : sellingPrice,
      unit_price: Number.isNaN(sellingPrice) ? 0 : sellingPrice,
      stock_quantity:
        addForm.item_type === "service" || Number.isNaN(stockQuantity) ? 0 : stockQuantity,
      unit: addForm.unit.trim() || undefined,
    };
    createProduct.mutate(payload, {
      onSuccess: (newProduct) => {
        refetchProducts();
        if (newProduct) {
          onAddLine({
            id: newProduct.id,
            name: newProduct.name,
            item_type: newProduct.item_type,
            base_price: Number(newProduct.base_price),
            selling_price: Number(newProduct.selling_price),
            stock_quantity: Number(newProduct.stock_quantity),
            unit_price: Number(newProduct.selling_price),
          });
        }
        setAddOpen(false);
        setPickerOpen(false);
        resetAddForm();
        setSearch("");
      },
    });
  };

  return (
    <>
      {!isControlled && (
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="basis-4/6 justify-start font-normal"
          >
            <Package className="text-muted-foreground mr-2 size-4 shrink-0" />
            <span className="text-muted-foreground">Add from product...</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => {
              resetAddForm();
              setAddOpen(true);
            }}
            title="Add new product or service"
            className="basis-auto"
          >
            <Plus className="size-4" />
            Add product
          </Button>
        </div>
      )}

      {/* Product Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add from product</DialogTitle>
            <DialogDescription>
              Search and pick a product or service to add as a line item.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description..."
              className="pl-9"
              autoFocus
            />
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            className="-mx-6 max-h-[50vh] min-h-0 flex-1 overflow-y-auto px-6"
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  {search ? "No products match your search." : "No products yet."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetAddForm();
                    if (search.trim()) {
                      setAddForm((p) => ({ ...p, name: search.trim() }));
                    }
                    setAddOpen(true);
                  }}
                >
                  <Plus className="mr-1 size-4" />
                  Add product
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {visible.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-md px-1 py-3 text-left transition-colors"
                  >
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium uppercase">
                      {product.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      {(product.description || product.unit) && (
                        <p className="text-muted-foreground truncate text-xs">
                          {[product.item_type, product.description, product.unit]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {Number(product.selling_price).toLocaleString()}
                    </span>
                  </button>
                ))}
                {hasMore && (
                  <div className="flex justify-center py-3">
                    <Spinner className="size-4" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-2">
            <p className="text-muted-foreground text-xs">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetAddForm();
                setAddOpen(true);
              }}
            >
              <Plus className="mr-1 size-4" />
              New product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add product or service</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              Create a new item and add it as a line to this invoice.
              {businessId && (
                <span className="flex items-center gap-2">
                  Business:{" "}
                  <Badge variant="secondary" className="font-normal">
                    {businessName ?? "—"}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Item type *</Label>
              <Select
                value={addForm.item_type}
                onValueChange={(value) => setAddForm((p) => ({ ...p, item_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-product-name">Name *</Label>
              <Input
                id="new-product-name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Web Development"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-product-desc">Description</Label>
              <Textarea
                id="new-product-desc"
                value={addForm.description}
                onChange={(e) => setAddForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-product-base-price">Base price *</Label>
                <Input
                  id="new-product-base-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(addForm.base_price)}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      base_price: parsePriceInput(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-product-selling-price">Selling price *</Label>
                <Input
                  id="new-product-selling-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(addForm.selling_price)}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      selling_price: parsePriceInput(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-product-unit">Unit</Label>
                <Input
                  id="new-product-unit"
                  value={addForm.unit}
                  onChange={(e) => setAddForm((p) => ({ ...p, unit: e.target.value }))}
                  placeholder="e.g. kg, piece, item, etc."
                />
              </div>
              {addForm.item_type === "product" && (
                <div className="space-y-1.5">
                  <Label htmlFor="new-product-stock">Initial stock</Label>
                  <Input
                    id="new-product-stock"
                    inputMode="decimal"
                    value={addForm.stock_quantity}
                    onChange={(e) =>
                      setAddForm((p) => ({
                        ...p,
                        stock_quantity: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            {Number(addForm.selling_price || 0) < Number(addForm.base_price || 0) && (
              <p className="text-destructive text-xs">
                Selling price must be equal to or above the base price.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={
                !addForm.name.trim() ||
                !addForm.selling_price.trim() ||
                Number(addForm.selling_price || 0) < Number(addForm.base_price || 0)
              }
              isLoading={createProduct.isPending}
            >
              Add & Use Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ProductPickerDialog };
