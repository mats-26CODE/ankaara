"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { useCreateLoan } from "@/hooks/use-loans";
import { useFormatAmount } from "@/hooks/use-format-amount";
import { useTranslation } from "@/hooks/use-translation";
import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import {
  ProductPickerDialog,
  type ProductLinePayload,
} from "@/components/shared/product-picker-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type LoanLine = {
  product_id: string;
  description: string;
  item_type: string;
  stock_quantity: number;
  quantity: string;
  unit_price: string;
  discount: string;
};

const lineTotal = (line: LoanLine) =>
  (Number(line.quantity) || 0) * (Number(line.unit_price) || 0) - (Number(line.discount) || 0);

const LoanCreatePage = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { businesses } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { format: formatAmount } = useFormatAmount();
  const { clients, refetch: refetchClients } = useClients(currentBusinessId, 1, 100, {
    includeWalkIn: false,
  });
  const { products, refetch: refetchProducts } = useProducts(currentBusinessId, 1, 200);
  const createLoan = useCreateLoan();

  const [clientId, setClientId] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LoanLine[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness((businesses.find((business) => business.is_primary) ?? businesses[0]).id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line), 0),
    [lines],
  );

  const canSubmit =
    !!clientId &&
    !!loanDate &&
    lines.length > 0 &&
    lines.every((line) => line.product_id && Number(line.quantity) > 0 && Number(line.unit_price) > 0);

  const addItemFromProduct = (product: ProductLinePayload) => {
    setLines((prev) => [
      ...prev,
      {
        product_id: product.id,
        description: product.name,
        item_type: product.item_type,
        stock_quantity: product.stock_quantity,
        quantity: "1",
        unit_price: String(product.unit_price),
        discount: "0",
      },
    ]);
    setProductPickerOpen(false);
  };

  const handleCreateLoan = () => {
    if (!currentBusinessId || !clientId) return;
    const items = lines
      .filter((line) => line.product_id && Number(line.quantity) > 0 && Number(line.unit_price) > 0)
      .map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        discount: Number(line.discount) || 0,
      }));

    if (items.length === 0) return;

    createLoan.mutate(
      {
        business_id: currentBusinessId,
        client_id: clientId,
        loan_date: loanDate,
        currency: businesses.find((business) => business.id === currentBusinessId)?.currency ?? "TZS",
        notes: notes.trim() || null,
        items,
      },
      {
        onSuccess: () => router.push("/dashboard/loans"),
      },
    );
  };

  if (!currentBusinessId) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-4 md:space-y-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/loans">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.loans.create.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("dashboard.loans.create.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={handleCreateLoan}
          isLoading={createLoan.isPending}
          disabled={!canSubmit || createLoan.isPending}
        >
          {t("dashboard.common.saveLoan")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.loans.create.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dashboard.loans.create.loanDate")}</Label>
                <DatePicker
                  value={loanDate}
                  onChange={setLoanDate}
                  placeholder={t("dashboard.loans.create.loanDatePlaceholder")}
                  disableFuture
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.common.client")}</Label>
                <ClientPickerDialog
                  businessId={currentBusinessId}
                  value={clientId}
                  onChange={setClientId}
                  clients={clients}
                  refetchClients={refetchClients}
                  contextLabel="loan"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("dashboard.common.notes")}</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("dashboard.loans.create.notesPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{t("dashboard.loans.create.itemsTitle")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setProductPickerOpen(true)}>
                <Plus className="mr-1 size-4" />
                {t("dashboard.common.addItem")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {t("dashboard.loans.create.itemsEmpty")}
                </p>
              )}
              {lines.map((line, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">{line.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={line.item_type === "service" ? "secondary" : "default"}>
                          {line.item_type === "service"
                            ? t("dashboard.common.service")
                            : t("dashboard.common.product")}
                        </Badge>
                        {line.item_type === "product" && (
                          <span className="text-muted-foreground text-xs">
                            {t("dashboard.sales.create.stockLabel")}{" "}
                            {Number(line.stock_quantity).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev))
                      }
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.qtyRequired")}</Label>
                      <Input
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, quantity: e.target.value.replace(/[^\d.]/g, "") }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label>{t("dashboard.common.priceRequired")}</Label>
                      <Input
                        inputMode="decimal"
                        value={line.unit_price}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, unit_price: e.target.value.replace(/[^\d.]/g, "") }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.discount")}</Label>
                      <Input
                        inputMode="decimal"
                        value={line.discount}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, discount: e.target.value.replace(/[^\d.]/g, "") }
                                : entry,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="text-muted-foreground text-xs">{t("dashboard.common.lineTotal")}</p>
                    <p className="font-medium">{formatAmount(lineTotal(line), { decimalDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductPickerDialog
            businessId={currentBusinessId}
            businessName={businesses.find((business) => business.id === currentBusinessId)?.name ?? null}
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
              <span className="font-medium">{lines.filter((line) => line.product_id).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t("dashboard.common.estimatedTotal")}</span>
              <span className="font-medium">{formatAmount(subtotal, { decimalDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">{t("dashboard.common.outstanding")}</span>
              <span className="text-lg font-bold">
                {formatAmount(subtotal, { decimalDigits: 0 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoanCreatePage;
