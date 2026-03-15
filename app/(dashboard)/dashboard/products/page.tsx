"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type FormState = {
  name: string;
  description: string;
  unit_price: string;
  unit: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  unit_price: "",
  unit: "",
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
      setCurrentBusiness(businesses[0].id);
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
        p.unit?.toLowerCase().includes(q),
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
      unit_price: String(product.unit_price ?? ""),
      unit: product.unit || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const unitPrice = Number(form.unit_price);
    if (editingProduct) {
      updateProduct.mutate(
        {
          id: editingProduct.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          unit_price: isNaN(unitPrice) ? 0 : unitPrice,
          unit: form.unit.trim() || null,
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
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          unit_price: isNaN(unitPrice) ? 0 : unitPrice,
          unit: form.unit.trim() || undefined,
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
          <h1 className="text-2xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground text-sm">
            Add items to reuse when creating invoices. For{" "}
            <span className="font-medium">
              {businesses.find((b) => b.id === currentBusinessId)?.name ?? "your business"}
            </span>
            .
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Product
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
                  ? "No products or services yet. Add items to use when creating invoices."
                  : "No items match your search."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="hidden md:table-cell">Unit</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate sm:table-cell">
                      {product.description || "—"}
                    </TableCell>
                    <TableCell>{Number(product.unit_price).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {product.unit || "—"}
                    </TableCell>
                    <TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
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

          <div className="space-y-4 py-2">
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
                <Label htmlFor="product-price">Unit Price *</Label>
                <Input
                  id="product-price"
                  inputMode="decimal"
                  value={formatPriceDisplay(form.unit_price)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unit_price: parsePriceInput(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-unit">Unit</Label>
                <Input
                  id="product-unit"
                  value={form.unit}
                  onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  placeholder="e.g. kg, piece, item, etc."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || isMutating}
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
