"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import {
  ProductPickerDialog,
  type ProductLinePayload,
} from "@/components/shared/product-picker-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import {
  useSale,
  useUpdateDirectSale,
  type DirectSaleItemInput,
  type UpdateDirectSaleItemInput,
} from "@/hooks/use-sales";
import { useCanManageSales } from "@/hooks/use-staff-permissions";
import { useTranslation } from "@/hooks/use-translation";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";

type EditSaleLine = DirectSaleItemInput & {
  sale_item_id?: string;
  item_type: string;
  base_price: number;
  stock_quantity: number;
  returned_quantity?: number;
  original_effective_sold?: number;
};

const lineTotal = (item: EditSaleLine) => item.quantity * item.unit_price - (item.discount ?? 0);

const itemMeetsMinimumPrice = (item: EditSaleLine) => {
  const quantity = Number(item.quantity) || 0;
  if (quantity <= 0) return true;
  return lineTotal(item) / quantity >= Number(item.base_price);
};

const hasEnoughStockForEdit = (item: EditSaleLine) => {
  if (item.item_type !== "product") return true;
  const ceiling = Number(item.stock_quantity) + Number(item.original_effective_sold ?? item.quantity);
  return Number(item.quantity) <= ceiling;
};

const editLineMeetsMinimumQuantity = (item: EditSaleLine) =>
  Number(item.quantity) >= Number(item.returned_quantity ?? 0);

const EditSalePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const id = useRouteUuidParam("id");
  const canManageSales = useCanManageSales();
  const { sale, loading } = useSale(id);
  const updateSale = useUpdateDirectSale();
  const { clients, refetch: refetchClients } = useClients(sale?.business_id ?? null);
  const { products, loading: productsLoading, refetch: refetchProducts } = useProducts(
    sale?.business_id ?? null,
  );

  const [clientId, setClientId] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditSaleLine[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  useEffect(() => {
    if (!sale) return;

    const productsById = new Map(products.map((product) => [product.id, product]));

    setClientId(sale.client_id ?? "");
    setSaleDate(sale.sale_date);
    setNotes(sale.notes ?? "");
    setItems(
      (sale.items ?? []).map((item) => {
        const product = item.product_id ? productsById.get(item.product_id) : undefined;
        const returnedQty = Number(item.returned_quantity) || 0;
        const quantity = Number(item.quantity) || 0;

        return {
          sale_item_id: item.id,
          product_id: item.product_id ?? "",
          description: item.description,
          item_type: item.item_type,
          base_price: Number(product?.base_price ?? item.base_price) || 0,
          stock_quantity: Number(product?.stock_quantity) || 0,
          quantity,
          unit_price: Number(item.unit_price) || 0,
          discount: Number(item.discount) || 0,
          returned_quantity: returnedQty,
          original_effective_sold: Math.max(quantity - returnedQty, 0),
        };
      }),
    );
  }, [products, sale]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + lineTotal(item), 0), [items]);
  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.base_price, 0),
    [items],
  );
  const profit = subtotal - totalCost;
  const walkInClient = useMemo(() => clients.find((client) => client.is_walk_in), [clients]);

  const updateItem = (index: number, field: keyof EditSaleLine, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    const item = items[index];
    if ((item?.returned_quantity ?? 0) > 0) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItemFromProduct = (product: ProductLinePayload) => {
    setItems((prev) => [
      {
        product_id: product.id,
        description: product.name,
        item_type: product.item_type,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        quantity: 1,
        unit_price: product.unit_price,
        discount: 0,
        returned_quantity: 0,
        original_effective_sold: 0,
      },
      ...prev,
    ]);
    setProductPickerOpen(false);
  };

  const canSubmit =
    !!id &&
    !!saleDate &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.product_id &&
        item.quantity > 0 &&
        item.unit_price > 0 &&
        lineTotal(item) >= 0 &&
        itemMeetsMinimumPrice(item) &&
        hasEnoughStockForEdit(item) &&
        editLineMeetsMinimumQuantity(item),
    );

  const handleSubmit = () => {
    if (!canSubmit || !id) return;

    const payloadItems: UpdateDirectSaleItemInput[] = items.map((item) => ({
      id: item.sale_item_id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount ?? 0,
    }));

    updateSale.mutate(
      {
        sale_id: id,
        client_id: clientId || walkInClient?.id || null,
        sale_date: saleDate,
        notes: notes.trim() || null,
        items: payloadItems,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/sales/${id}`);
        },
      },
    );
  };

  if (!id || loading || productsLoading || !sale) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!canManageSales || !sale || sale.source !== "direct") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">{t("dashboard.sales.edit.notEditable")}</p>
        <Button variant="outline" asChild>
          <Link href={sale ? `/dashboard/sales/${sale.id}` : "/dashboard/sales"}>
            {t("dashboard.common.backToSales")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-4 md:space-y-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/sales/${sale.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.sales.edit.title")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.sales.edit.subtitlePrefix")}{" "}
              <span className="font-medium">{sale.sale_number}</span>.
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit || updateSale.isPending} isLoading={updateSale.isPending}>
          {t("dashboard.sales.edit.save")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.sales.create.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dashboard.sales.create.saleDate")}</Label>
                <DatePicker value={saleDate} onChange={setSaleDate} disableFuture />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.common.client")}</Label>
                <ClientPickerDialog
                  businessId={sale.business_id}
                  value={clientId}
                  onChange={setClientId}
                  clients={clients}
                  refetchClients={refetchClients}
                  contextLabel="sale"
                  includeWalkIn
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.common.notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t("dashboard.sales.create.notesPlaceholder")}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{t("dashboard.sales.create.itemsTitle")}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setProductPickerOpen(true)}>
                <Plus className="mr-1 size-4" />
                {t("dashboard.common.addItem")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.sale_item_id ?? `${item.product_id}-${idx}`} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.item_type === "service" ? "secondary" : "default"}>
                          {item.item_type === "service"
                            ? t("dashboard.common.service")
                            : t("dashboard.common.product")}
                        </Badge>
                        {item.item_type === "product" ? (
                          <span className="text-muted-foreground text-xs">
                            {t("dashboard.sales.create.stockLabel")}{" "}
                            {Number(item.stock_quantity).toLocaleString()}
                          </span>
                        ) : null}
                        {(item.returned_quantity ?? 0) > 0 ? (
                          <span className="text-muted-foreground text-xs">
                            {t("dashboard.sales.edit.returnedQty", {
                              qty: Number(item.returned_quantity).toLocaleString(),
                            })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      disabled={(item.returned_quantity ?? 0) > 0}
                      title={
                        (item.returned_quantity ?? 0) > 0
                          ? t("dashboard.sales.edit.cannotRemoveReturned")
                          : undefined
                      }
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.qtyRequired")}</Label>
                      <Input
                        type="number"
                        min={item.returned_quantity ?? 0.0001}
                        step="any"
                        value={item.quantity || ""}
                        onChange={(event) => updateItem(idx, "quantity", Number(event.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.priceRequired")}</Label>
                      <Input
                        type="number"
                        min={item.base_price}
                        step="any"
                        value={item.unit_price || ""}
                        onChange={(event) => updateItem(idx, "unit_price", Number(event.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.discount")}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.discount === 0 ? "" : item.discount}
                        onChange={(event) => updateItem(idx, "discount", Number(event.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.total")}</Label>
                      <Input readOnly value={lineTotal(item).toLocaleString()} className="bg-muted" />
                    </div>
                  </div>
                  {!itemMeetsMinimumPrice(item) ? (
                    <p className="text-destructive text-sm">
                      {t("dashboard.common.belowBasePriceError", {
                        amount: Number(item.base_price).toLocaleString(),
                      })}
                    </p>
                  ) : null}
                  {!hasEnoughStockForEdit(item) ? (
                    <p className="text-destructive text-sm">{t("dashboard.sales.create.exceedsStock")}</p>
                  ) : null}
                  {!editLineMeetsMinimumQuantity(item) ? (
                    <p className="text-destructive text-sm">
                      {t("dashboard.sales.edit.cannotRemoveReturned")}
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductPickerDialog
            businessId={sale.business_id}
            businessName={null}
            products={products}
            refetchProducts={refetchProducts}
            onAddLine={addItemFromProduct}
            open={productPickerOpen}
            onOpenChange={setProductPickerOpen}
          />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.common.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("dashboard.common.items")}</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("dashboard.sales.create.summarySales")}</span>
              <span className="font-medium">{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("dashboard.common.cost")}</span>
              <span className="font-medium">{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">{t("dashboard.common.profit")}</span>
              <span className="text-lg font-bold">{profit.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditSalePage;
