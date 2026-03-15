"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  useCreateProduct,
  type Product,
  type CreateProductPayload,
} from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
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
  unit_price: number;
};

type ProductPickerDialogProps = {
  businessId: string | null;
  products: Product[];
  refetchProducts: () => void;
  onAddLine: (product: ProductLinePayload) => void;
  /** When set, dialog is controlled by parent; no trigger buttons rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ProductPickerDialog = ({
  businessId,
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
    unit_price: "",
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
      unit_price: Number(product.unit_price),
    });
    setPickerOpen(false);
    setSearch("");
  };

  const resetAddForm = () => {
    setAddForm({ name: "", description: "", unit_price: "", unit: "" });
  };

  const handleAddProduct = () => {
    if (!addForm.name.trim() || !businessId) return;
    const unitPrice = Number(addForm.unit_price);
    const payload: CreateProductPayload = {
      business_id: businessId,
      name: addForm.name.trim(),
      description: addForm.description.trim() || undefined,
      unit_price: Number.isNaN(unitPrice) ? 0 : unitPrice,
      unit: addForm.unit.trim() || undefined,
    };
    createProduct.mutate(payload, {
      onSuccess: (newProduct) => {
        refetchProducts();
        if (newProduct) {
          onAddLine({
            id: newProduct.id,
            name: newProduct.name,
            unit_price: Number(newProduct.unit_price),
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
            <Package className="mr-2 size-4 shrink-0 text-muted-foreground" />
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
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
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
            className="-mx-6 min-h-0 max-h-[50vh] flex-1 overflow-y-auto px-6"
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
                    className="flex w-full items-center gap-3 rounded-md px-1 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium uppercase">
                      {product.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      {(product.description || product.unit) && (
                        <p className="text-muted-foreground truncate text-xs">
                          {[product.description, product.unit].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {Number(product.unit_price).toLocaleString()}
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
            <DialogDescription>
              Create a new item and add it as a line to this invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
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
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-product-price">Unit price *</Label>
                <Input
                  id="new-product-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(addForm.unit_price)}
                  onChange={(e) =>
                    setAddForm((p) => ({
                      ...p,
                      unit_price: parsePriceInput(e.target.value),
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-product-unit">Unit</Label>
                <Input
                  id="new-product-unit"
                  value={addForm.unit}
                  onChange={(e) => setAddForm((p) => ({ ...p, unit: e.target.value }))}
                  placeholder="e.g. hr, item"
                />
              </div>
            </div>
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
              disabled={!addForm.name.trim()}
              isLoading={createProduct.isPending}
            >
              Add & use as line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ProductPickerDialog };
