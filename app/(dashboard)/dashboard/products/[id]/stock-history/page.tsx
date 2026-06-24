"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  useProduct,
  useInventoryMovements,
  useAdjustProductStock,
  useDeleteProduct,
  type InventoryMovement,
} from "@/hooks/use-products";
import { useBusinesses } from "@/hooks/use-businesses";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import { useTranslation } from "@/hooks/use-translation";
import { ProductEditDialog } from "@/components/inventory/product-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

type StockFormState = {
  quantity_delta: string;
  movement_type: "adjustment" | "restock";
  reason: string;
};

const emptyStockForm: StockFormState = {
  quantity_delta: "",
  movement_type: "restock",
  reason: "",
};
const MOVEMENTS_PAGE_SIZE = 20;

const movementTypeKey = (type: string) => `dashboard.status.${type}` as const;

const SALE_MOVEMENT_REASON_PREFIXES = [
  "Direct sale ",
  "Return from sale ",
  "Line removed from sale ",
  "Sale edit ",
] as const;

const MovementReason = ({ movement }: { movement: InventoryMovement }) => {
  const reason = movement.reason?.trim();
  if (!reason) return <>—</>;

  if (!movement.sale_id) {
    return <>{reason}</>;
  }

  const prefix = SALE_MOVEMENT_REASON_PREFIXES.find((p) => reason.startsWith(p));
  if (prefix) {
    const saleNumber = reason.slice(prefix.length);
    return (
      <>
        {prefix}
        <Link
          href={`/dashboard/sales/${movement.sale_id}`}
          className="text-primary font-medium hover:underline"
        >
          {saleNumber}
        </Link>
      </>
    );
  }

  return (
    <Link
      href={`/dashboard/sales/${movement.sale_id}`}
      className="text-primary font-medium hover:underline"
    >
      {reason}
    </Link>
  );
};

const ProductStockHistoryPage = () => {
  const { t } = useTranslation();
  const id = useRouteUuidParam("id");
  const router = useRouter();
  const [movementPage, setMovementPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { businesses } = useBusinesses();
  const { product, loading: productLoading, refetch: refetchProduct } = useProduct(id);
  const {
    movements,
    loading: movementsLoading,
    refetch: refetchMovements,
    totalCount: movementTotalCount,
  } = useInventoryMovements(id, movementPage, MOVEMENTS_PAGE_SIZE);
  const adjustProductStock = useAdjustProductStock();
  const deleteProduct = useDeleteProduct();
  const [stockForm, setStockForm] = useState<StockFormState>(emptyStockForm);

  useEffect(() => {
    setMovementPage(1);
  }, [id]);

  const handleAdjustStock = () => {
    if (!product || product.item_type !== "product") return;
    const rawQuantity = Number(stockForm.quantity_delta);
    if (Number.isNaN(rawQuantity) || rawQuantity === 0) return;
    const quantityDelta =
      stockForm.movement_type === "restock" ? Math.abs(rawQuantity) : rawQuantity;

    adjustProductStock.mutate(
      {
        product_id: product.id,
        quantity_delta: quantityDelta,
        movement_type: stockForm.movement_type,
        reason: stockForm.reason.trim() || null,
        unit_cost: Number(product.base_price) || null,
      },
      {
        onSuccess: () => {
          setStockForm(emptyStockForm);
          setMovementPage(1);
          refetchProduct();
          refetchMovements();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!product) return;
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.replace("/dashboard/products");
      },
    });
  };

  if (!id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">{t("dashboard.products.stockHistory.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">{t("dashboard.common.backToInventory")}</Link>
        </Button>
      </div>
    );
  }

  const isProduct = product.item_type === "product";
  const productDescription = product.description?.trim() ?? "";
  const totalMovements = movementTotalCount ?? 0;
  const totalMovementPages = Math.max(1, Math.ceil(totalMovements / MOVEMENTS_PAGE_SIZE));
  const hasPreviousMovementPage = movementPage > 1;
  const hasNextMovementPage = movementPage < totalMovementPages;
  const movementStart = totalMovements === 0 ? 0 : (movementPage - 1) * MOVEMENTS_PAGE_SIZE + 1;
  const movementEnd = Math.min(movementPage * MOVEMENTS_PAGE_SIZE, totalMovements);
  const businessName =
    businesses.find((business) => business.id === product.business_id)?.name ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight wrap-break-word">{product.name}</h1>
              <Badge variant={isProduct ? "default" : "secondary"}>
                {isProduct ? t("dashboard.common.product") : t("dashboard.common.service")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.products.stockHistory.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/products">{t("dashboard.products.stockHistory.seeAll")}</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-1 size-4" />
            {t("dashboard.common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.products.stockHistory.overviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {productDescription ? (
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">{t("dashboard.common.description")}</p>
              <p className="mt-1 text-sm leading-relaxed">{productDescription}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">{t("dashboard.products.stockHistory.currentStock")}</p>
              <p className="font-semibold">
                {isProduct ? Number(product.stock_quantity).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("dashboard.common.basePrice")}</p>
              <p className="font-semibold">{Number(product.base_price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t("dashboard.common.sellingPrice")}</p>
              <p className="font-semibold">{Number(product.selling_price).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.products.stockHistory.adjustTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("dashboard.products.stockHistory.movement")}</Label>
                <Select
                  value={stockForm.movement_type}
                  onValueChange={(value) =>
                    setStockForm((p) => ({
                      ...p,
                      movement_type: value as "adjustment" | "restock",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restock">{t("dashboard.products.stockHistory.addStock")}</SelectItem>
                    <SelectItem value="adjustment">{t("dashboard.status.adjustment")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-quantity">{t("dashboard.products.stockHistory.quantityChange")}</Label>
                <Input
                  id="stock-quantity"
                  inputMode="decimal"
                  value={stockForm.quantity_delta}
                  onChange={(e) =>
                    setStockForm((p) => ({
                      ...p,
                      quantity_delta: e.target.value.replace(/[^\d.-]/g, ""),
                    }))
                  }
                  placeholder={
                    stockForm.movement_type === "restock"
                      ? t("dashboard.products.stockHistory.restockPlaceholder")
                      : t("dashboard.products.stockHistory.adjustmentPlaceholder")
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-reason">{t("dashboard.products.stockHistory.reason")}</Label>
              <Textarea
                id="stock-reason"
                value={stockForm.reason}
                onChange={(e) => setStockForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder={t("dashboard.products.stockHistory.reasonPlaceholder")}
                rows={2}
              />
            </div>

            <Button
              onClick={handleAdjustStock}
              disabled={!stockForm.quantity_delta.trim() || adjustProductStock.isPending}
              isLoading={adjustProductStock.isPending}
              className="w-full sm:w-auto"
            >
              {t("dashboard.common.saveStockMovement")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("dashboard.products.stockHistory.servicesNotStocked")}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.products.stockHistory.movementsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {movementsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground rounded-md border p-4 text-sm">
              {t("dashboard.products.stockHistory.movementsEmpty")}
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-md border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t("dashboard.common.date")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("dashboard.products.stockHistory.movement")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("dashboard.products.stockHistory.delta")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("dashboard.products.stockHistory.before")}</th>
                      <th className="px-3 py-2 text-right font-medium">{t("dashboard.products.stockHistory.after")}</th>
                      <th className="px-3 py-2 text-left font-medium">{t("dashboard.products.stockHistory.reason")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {dayjs(movement.created_at).format("MMM D, YYYY · h:mm A")}
                        </td>
                        <td className="px-3 py-2">
                          {t(movementTypeKey(movement.movement_type))}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium ${
                            Number(movement.quantity_delta) < 0
                              ? "text-destructive"
                              : "text-emerald-600"
                          }`}
                        >
                          {Number(movement.quantity_delta) > 0 ? "+" : ""}
                          {Number(movement.quantity_delta).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(movement.quantity_before).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(movement.quantity_after).toLocaleString()}
                        </td>
                        <td className="text-muted-foreground px-3 py-2">
                          <MovementReason movement={movement} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {movements.map((movement) => (
                  <div key={movement.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {t(movementTypeKey(movement.movement_type))}
                      </span>
                      <span
                        className={
                          Number(movement.quantity_delta) < 0
                            ? "text-destructive font-medium"
                            : "font-medium text-emerald-600"
                        }
                      >
                        {Number(movement.quantity_delta) > 0 ? "+" : ""}
                        {Number(movement.quantity_delta).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {dayjs(movement.created_at).format("MMM D, YYYY · h:mm A")}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {Number(movement.quantity_before).toLocaleString()} →{" "}
                      {Number(movement.quantity_after).toLocaleString()}
                      {movement.reason ? (
                        <>
                          {" · "}
                          <MovementReason movement={movement} />
                        </>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              {t("dashboard.common.showingMovements", {
                from: movementStart,
                to: movementEnd,
                total: totalMovements,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPreviousMovementPage || movementsLoading}
              >
                {t("dashboard.common.previous")}
              </Button>
              <p className="text-muted-foreground min-w-20 text-center text-xs">
                {t("dashboard.common.paginationPage", {
                  page: movementPage,
                  totalPages: totalMovementPages,
                })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementPage((prev) => Math.min(prev + 1, totalMovementPages))}
                disabled={!hasNextMovementPage || movementsLoading}
              >
                {t("dashboard.common.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductEditDialog
        product={product}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refetchProduct}
        businessName={businessName}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dashboard.common.deleteProductTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.common.deleteProductDescription", { name: product.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteProduct.isPending}
            >
              {t("dashboard.common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteProduct.isPending}
            >
              {t("dashboard.common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductStockHistoryPage;
