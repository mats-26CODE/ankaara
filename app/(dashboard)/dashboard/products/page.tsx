"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deferNavigation } from "@/lib/navigation/defer-navigation";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
  type ProductItemType,
} from "@/hooks/use-products";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  PackagePlus,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const emptyForm: FormState = {
  name: "",
  description: "",
  item_type: "product",
  base_price: "",
  selling_price: "",
  stock_quantity: "",
  low_stock_threshold: "",
  unit: "",
  sku: "",
};

const PAGE_SIZE = 10;

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

const ProductsPage = () => {
  const router = useRouter();
  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const [page, setPage] = useState(1);
  const { products, loading, refetch, totalCount } = useProducts(
    currentBusinessId,
    page,
    PAGE_SIZE,
  );
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const total = totalCount ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    setPage(1);
  }, [currentBusinessId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.unit?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.item_type.toLowerCase().includes(q),
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
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
    setDialogOpen(true);
  };

  const openDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

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

    const productFields = {
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
    };

    if (editingProduct) {
      updateProduct.mutate(
        {
          id: editingProduct.id,
          ...productFields,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            refetch();
          },
        },
      );
    } else {
      if (!currentBusinessId) return;
      createProduct.mutate(
        {
          business_id: currentBusinessId,
          ...productFields,
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            refetch();
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingProduct(null);
        refetch();
      },
    });
  };

  const isMutating = createProduct.isPending || updateProduct.isPending || deleteProduct.isPending;

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Building2 className="text-muted-foreground size-12" />
          <div className="space-y-1 text-center">
            <p className="font-medium">No business yet</p>
            <p className="text-muted-foreground text-sm">
              Create a business first to add products or services.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/settings/businesses">Go to Businesses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground text-sm">
            Manage products, services, prices, and stock for{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ?? "your business"}
            </span>
            .
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {products.length === 0
                  ? "No products or services yet. Add inventory items to start selling."
                  : "No items match your search."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Base</TableHead>
                  <TableHead>Selling</TableHead>
                  <TableHead className="hidden lg:table-cell">Stock</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      deferNavigation(() =>
                        router.push(`/dashboard/products/${product.id}/stock-history`),
                      )
                    }
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-muted-foreground max-w-[220px] truncate text-xs">
                          {[product.sku, product.description, product.unit]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.item_type === "service" ? "secondary" : "default"}>
                        {product.item_type === "service" ? "Service" : "Product"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {Number(product.base_price).toLocaleString()}
                    </TableCell>
                    <TableCell>{Number(product.selling_price).toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.item_type === "product" ? (
                        <span
                          className={
                            product.low_stock_threshold != null &&
                            Number(product.stock_quantity) <= Number(product.low_stock_threshold)
                              ? "text-destructive font-medium"
                              : undefined
                          }
                        >
                          {Number(product.stock_quantity).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(product)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          {product.item_type === "product" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/products/${product.id}/stock-history`}>
                                <PackagePlus className="mr-2 size-4" />
                                Stock history
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openDelete(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {from}–{to} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || loading}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product or Service"}</DialogTitle>
            <DialogDescription className="flex flex-col gap-2">
              {editingProduct
                ? "Update the item. Changes won't affect existing invoices."
                : "Add an item to use when creating invoices."}
              {currentBusinessId && (
                <span className="flex items-center gap-2">
                  Business:{" "}
                  <Badge variant="secondary" className="font-normal">
                    {businesses.find((b) => b.id === currentBusinessId)?.name ?? "—"}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2 pr-1">
            <div className="space-y-2">
              <Label>Item Type *</Label>
              <Select
                value={form.item_type}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, item_type: value as ProductItemType }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Name *</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Web Development, Consulting Hour"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-desc">Description</Label>
              <Textarea
                id="product-desc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-base-price">Base Price *</Label>
                <Input
                  id="product-base-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(form.base_price)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, base_price: parsePriceInput(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-selling-price">Selling Price *</Label>
                <Input
                  id="product-selling-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(form.selling_price)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, selling_price: parsePriceInput(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-unit">Unit</Label>
                <Input
                  id="product-unit"
                  value={form.unit}
                  onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  placeholder="e.g. kg, piece, item, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            {form.item_type === "product" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-stock">Current Stock</Label>
                  <Input
                    id="product-stock"
                    inputMode="decimal"
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        stock_quantity: e.target.value.replace(/[^\d.-]/g, ""),
                      }))
                    }
                    placeholder="0"
                    disabled={!!editingProduct}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-low-stock">Low Stock Alert</Label>
                  <Input
                    id="product-low-stock"
                    inputMode="decimal"
                    value={form.low_stock_threshold}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        low_stock_threshold: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            )}
            {Number(form.selling_price || 0) < Number(form.base_price || 0) && (
              <p className="text-destructive text-sm">
                Selling price must be equal to or above the base price.
              </p>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name.trim() ||
                !form.selling_price.trim() ||
                Number(form.selling_price || 0) < Number(form.base_price || 0) ||
                isMutating
              }
              isLoading={editingProduct ? updateProduct.isPending : createProduct.isPending}
            >
              {editingProduct ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This will remove &ldquo;{deletingProduct?.name}&rdquo; from your list. Existing
              invoices are not changed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isMutating}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
