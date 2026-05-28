"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useProduct, useInventoryMovements, useAdjustProductStock } from "@/hooks/use-products";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

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

const ProductStockHistoryPage = () => {
  const id = useRouteUuidParam("id");
  const router = useRouter();
  const [movementPage, setMovementPage] = useState(1);
  const { product, loading: productLoading, refetch: refetchProduct } = useProduct(id);
  const {
    movements,
    loading: movementsLoading,
    refetch: refetchMovements,
    totalCount: movementTotalCount,
  } = useInventoryMovements(id, movementPage, MOVEMENTS_PAGE_SIZE);
  const adjustProductStock = useAdjustProductStock();
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
        <p className="text-muted-foreground">Product not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">Back to inventory</Link>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <Badge variant={isProduct ? "default" : "secondary"}>
              {isProduct ? "Product" : "Service"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Stock movements and adjustments for this inventory item.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">See All Products or Services</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {productDescription ? (
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Description</p>
              <p className="mt-1 text-sm leading-relaxed">{productDescription}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Current stock</p>
              <p className="font-semibold">
                {isProduct ? Number(product.stock_quantity).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Base price</p>
              <p className="font-semibold">{Number(product.base_price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Selling price</p>
              <p className="font-semibold">{Number(product.selling_price).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Adjust stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Movement</Label>
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
                    <SelectItem value="restock">Add stock</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-quantity">Quantity change</Label>
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
                  placeholder={stockForm.movement_type === "restock" ? "10" : "-2 or 5"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-reason">Reason</Label>
              <Textarea
                id="stock-reason"
                value={stockForm.reason}
                onChange={(e) => setStockForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. Supplier restock, manual recount"
                rows={2}
              />
            </div>

            <Button
              onClick={handleAdjustStock}
              disabled={!stockForm.quantity_delta.trim() || adjustProductStock.isPending}
              isLoading={adjustProductStock.isPending}
              className="w-full sm:w-auto"
            >
              Save stock movement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">
          Services are not stocked; movement history applies to physical products only.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent movements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {movementsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground rounded-md border p-4 text-sm">
              No stock movement recorded yet.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-md border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Movement</th>
                      <th className="px-3 py-2 text-right font-medium">Delta</th>
                      <th className="px-3 py-2 text-right font-medium">Before</th>
                      <th className="px-3 py-2 text-right font-medium">After</th>
                      <th className="px-3 py-2 text-left font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {dayjs(movement.created_at).format("MMM D, YYYY · h:mm A")}
                        </td>
                        <td className="px-3 py-2 capitalize">
                          {movement.movement_type.replace("_", " ")}
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
                          {movement.reason?.trim() || "—"}
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
                      <span className="font-medium capitalize">
                        {movement.movement_type.replace("_", " ")}
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
                      {movement.reason ? ` · ${movement.reason}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              Showing {movementStart}-{movementEnd} of {totalMovements} movements
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPreviousMovementPage || movementsLoading}
              >
                Previous
              </Button>
              <p className="text-muted-foreground min-w-20 text-center text-xs">
                Page {movementPage} of {totalMovementPages}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMovementPage((prev) => Math.min(prev + 1, totalMovementPages))}
                disabled={!hasNextMovementPage || movementsLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductStockHistoryPage;
