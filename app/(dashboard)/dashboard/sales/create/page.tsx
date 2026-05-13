"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";
import { useBusinesses, type Business } from "@/hooks/use-businesses";
import { useClients, useEnsureWalkInClient } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useCreateDirectSale, type DirectSaleItemInput } from "@/hooks/use-sales";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import {
  ProductPickerDialog,
  type ProductLinePayload,
} from "@/components/shared/product-picker-dialog";
import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type SaleLine = DirectSaleItemInput & {
  item_type: string;
  base_price: number;
  stock_quantity: number;
};

const lineTotal = (item: SaleLine) => item.quantity * item.unit_price - (item.discount ?? 0);

const itemMeetsMinimumPrice = (item: SaleLine) => {
  const quantity = Number(item.quantity) || 0;
  if (quantity <= 0) return true;
  return lineTotal(item) / quantity >= Number(item.base_price);
};

const hasEnoughStock = (item: SaleLine) => {
  if (item.item_type !== "product") return true;
  return Number(item.quantity) <= Number(item.stock_quantity);
};

const CreateSalePage = () => {
  const router = useRouter();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { clients, refetch: refetchClients } = useClients(currentBusinessId);
  const { products, refetch: refetchProducts } = useProducts(currentBusinessId);
  const createSale = useCreateDirectSale();
  const ensureWalkInClient = useEnsureWalkInClient();
  const ensureRequestedBusinessId = useRef<string | null>(null);

  const [clientId, setClientId] = useState<string>("");
  const [saleDate, setSaleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleLine[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const currentBusiness = useMemo(
    () => businesses.find((b) => b.id === currentBusinessId) as Business | undefined,
    [businesses, currentBusinessId],
  );
  const walkInClient = useMemo(() => clients.find((client) => client.is_walk_in), [clients]);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    if (!currentBusinessId) return;

    if (walkInClient) {
      ensureRequestedBusinessId.current = null;
      setClientId((current) => current || walkInClient.id);
      return;
    }

    if (ensureRequestedBusinessId.current === currentBusinessId) return;

    ensureRequestedBusinessId.current = currentBusinessId;
    ensureWalkInClient.mutate(currentBusinessId, {
      onSuccess: (client) => {
        setClientId((current) => current || client.id);
        refetchClients();
      },
      onError: () => {
        ensureRequestedBusinessId.current = null;
      },
    });
  }, [currentBusinessId, walkInClient, ensureWalkInClient, refetchClients]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + lineTotal(item), 0), [items]);
  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.base_price, 0),
    [items],
  );
  const profit = subtotal - totalCost;

  const updateItem = (index: number, field: keyof SaleLine, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItemFromProduct = (product: ProductLinePayload) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        description: product.name,
        item_type: product.item_type,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        quantity: product.item_type === "service" ? 1 : 1,
        unit_price: product.unit_price,
        discount: 0,
      },
    ]);
    setProductPickerOpen(false);
  };

  const canSubmit =
    !!currentBusinessId &&
    !!saleDate &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.product_id &&
        item.quantity > 0 &&
        item.unit_price > 0 &&
        lineTotal(item) >= 0 &&
        itemMeetsMinimumPrice(item) &&
        hasEnoughStock(item),
    );

  const handleSubmit = () => {
    if (!canSubmit || !currentBusinessId || !currentBusiness) return;

    createSale.mutate(
      {
        business_id: currentBusinessId,
        client_id: clientId || walkInClient?.id || null,
        sale_date: saleDate,
        currency: currentBusiness.currency,
        notes: notes.trim() || null,
        items: items.map((item) => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount ?? 0,
        })),
      },
      {
        onSuccess: (row) => {
          setItems([]);
          router.push(`/dashboard/sales/${row.id}`);
        },
      },
    );
  };

  if (businessesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-4 md:space-y-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/sales">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Record Sale</h1>
            <p className="text-muted-foreground text-sm">
              Add a direct product or service sale for{" "}
              <span className="font-medium">{currentBusiness?.name ?? "your business"}</span>.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createSale.isPending}
          isLoading={createSale.isPending}
        >
          Save Sale
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sale Date</Label>
                <DatePicker value={saleDate} onChange={setSaleDate} disableFuture />
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <div className="space-y-2">
                  <ClientPickerDialog
                    businessId={currentBusinessId}
                    value={clientId}
                    onChange={setClientId}
                    clients={clients}
                    refetchClients={refetchClients}
                    contextLabel="sale"
                    includeWalkIn
                  />
                  {clientId && clientId !== walkInClient?.id && walkInClient && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setClientId(walkInClient.id)}
                      className="text-muted-foreground px-0"
                    >
                      Use walk-in customer
                    </Button>
                  )}
                  {clientId === walkInClient?.id && (
                    <p className="text-muted-foreground text-xs">
                      Walk-in Customer is selected by default for direct sales.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional sale note"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Sale Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductPickerOpen(true)}
              >
                <Plus className="mr-1 size-4" />
                Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Add products or services from inventory to record a sale.
                </p>
              )}
              {items.map((item, idx) => (
                <div key={`${item.product_id}-${idx}`} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.item_type === "service" ? "secondary" : "default"}>
                          {item.item_type === "service" ? "Service" : "Product"}
                        </Badge>
                        {item.item_type === "product" && (
                          <span className="text-muted-foreground text-xs">
                            Stock: {Number(item.stock_quantity).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Qty *</Label>
                      <Input
                        type="number"
                        min={0.0001}
                        step="any"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        min={item.base_price}
                        step="any"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.discount === 0 ? "" : item.discount}
                        onChange={(e) => updateItem(idx, "discount", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        readOnly
                        value={lineTotal(item).toLocaleString()}
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  {!itemMeetsMinimumPrice(item) && (
                    <p className="text-destructive text-sm">
                      Price after discount cannot be below base price{" "}
                      {Number(item.base_price).toLocaleString()}.
                    </p>
                  )}
                  {!hasEnoughStock(item) && (
                    <p className="text-destructive text-sm">
                      Quantity exceeds available stock for this product.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductPickerDialog
            businessId={currentBusinessId}
            businessName={currentBusiness?.name ?? null}
            products={products}
            refetchProducts={refetchProducts}
            onAddLine={addItemFromProduct}
            open={productPickerOpen}
            onOpenChange={setProductPickerOpen}
          />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Sales</span>
              <span className="font-medium">{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Cost</span>
              <span className="font-medium">{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">Profit</span>
              <span className="text-lg font-bold">{profit.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSalePage;
