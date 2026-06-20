"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoice, useUpdateInvoice, type InvoiceItemInput } from "@/hooks/use-invoices";
import { useQuotations } from "@/hooks/use-quotations";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import { ProductPickerDialog } from "@/components/shared/product-picker-dialog";
import { useCurrencies } from "@/hooks/use-currencies";
import { TEMPLATES, type TemplateId } from "@/lib/invoice-templates/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import { TemplateFullscreenPreviewDialog } from "@/components/shared/template-fullscreen-preview-dialog";
import dayjs from "dayjs";
import { useRouteUuidParam } from "@/hooks/use-route-uuid-param";
import { useTranslation } from "@/hooks/use-translation";

const EditInvoicePage = () => {
  const { t } = useTranslation();
  const id = useRouteUuidParam("id");
  const router = useRouter();
  const { invoice, loading } = useInvoice(id);
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateInvoice = useUpdateInvoice();

  const {
    clients,
    loading: clientsLoading,
    refetch: refetchClients,
  } = useClients(invoice?.business_id ?? null);
  const { products, refetch: refetchProducts } = useProducts(invoice?.business_id ?? null);
  const { quotations } = useQuotations(invoice?.business_id ?? null, null, 1, 100);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItemInput[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !invoice) return;
    setClientId(invoice.client_id);
    setIssueDate(invoice.issue_date);
    setDueDate(invoice.due_date);
    setCurrency(invoice.currency);
    const storedTax = Number(invoice.tax) || 0;
    const storedSubtotal = Number(invoice.subtotal) || 0;
    const pct =
      invoice.tax_percentage != null && Number(invoice.tax_percentage) >= 0
        ? Number(invoice.tax_percentage)
        : storedSubtotal > 0
          ? (storedTax / storedSubtotal) * 100
          : 0;
    setTax(pct ? String(Math.round(pct * 100) / 100) : "");
    setNotes(invoice.notes ?? "");
    setAccentColor(invoice.accent_color ?? "");
    setFooterNote(invoice.footer_note ?? "");
    setTemplateId((invoice.template_id as TemplateId) || "classic");
    setQuotationId(invoice.quotation_id ?? null);
    setItems(
      (invoice.items ?? []).map((item) => ({
        product_id: item.product_id ?? undefined,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount) || 0,
      })),
    );
    setPrefilled(true);
  }, [invoice, prefilled]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.quantity * item.unit_price - (item.discount ?? 0), 0),
    [items],
  );
  const totalDiscount = useMemo(
    () => items.reduce((sum, item) => sum + (item.discount ?? 0), 0),
    [items],
  );
  const taxPercent = Number(tax) || 0;
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount;

  const itemMeetsMinimumPrice = (item: InvoiceItemInput) => {
    if (!item.product_id || !item.base_price) return true;
    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) return true;
    const netUnitPrice =
      (quantity * Number(item.unit_price) - Number(item.discount ?? 0)) / quantity;
    return netUnitPrice >= Number(item.base_price);
  };

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItemFromProduct = (product: {
    id: string;
    name: string;
    item_type: string;
    base_price: number;
    stock_quantity: number;
    unit_price: number;
  }) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        item_type: product.item_type,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        description: product.name,
        quantity: 1,
        unit_price: product.unit_price,
        discount: 0,
      },
    ]);
    setProductPickerOpen(false);
  };

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const previewProps = useMemo(
    () => ({
      templateId,
      invoiceNumber: invoice?.invoice_number ?? "INV-PREVIEW",
      status: "draft",
      issueDate: issueDate || dayjs().format("YYYY-MM-DD"),
      dueDate: dueDate || dayjs().add(14, "day").format("YYYY-MM-DD"),
      currency: currency || "TZS",
      subtotal,
      totalDiscount: totalDiscount > 0 ? totalDiscount : undefined,
      tax: taxAmount,
      taxPercent: taxPercent || null,
      total,
      notes: notes || null,
      accentColor: accentColor.trim() || null,
      footerNote: footerNote.trim() || null,
      isPaid: false,
      business: invoice?.business ?? null,
      client: selectedClient
        ? {
            name: selectedClient.name,
            email: selectedClient.email ?? null,
            phone: selectedClient.phone ?? null,
            address: selectedClient.address ?? null,
          }
        : { name: "—", email: null, phone: null, address: null },
      items: items.map((item, i) => ({
        id: String(i),
        description: item.description || "—",
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: (item.discount ?? 0) > 0 ? item.discount : undefined,
        total: item.quantity * item.unit_price - (item.discount ?? 0),
      })),
    }),
    [
      templateId,
      invoice?.invoice_number,
      issueDate,
      dueDate,
      currency,
      subtotal,
      totalDiscount,
      taxAmount,
      taxPercent,
      total,
      notes,
      accentColor,
      footerNote,
      invoice?.business,
      selectedClient,
      items,
    ],
  );

  const canSubmit =
    !!clientId &&
    !!issueDate &&
    !!dueDate &&
    !!currency &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.description.trim() &&
        item.quantity > 0 &&
        item.unit_price > 0 &&
        itemMeetsMinimumPrice(item),
    );

  const handleSubmit = () => {
    if (!canSubmit || !id) return;
    updateInvoice.mutate(
      {
        id,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        quotation_id: quotationId,
        tax: taxAmount,
        tax_percentage: taxPercent,
        template_id: templateId,
        accent_color: accentColor.trim() || null,
        footer_note: footerNote.trim() || null,
        notes: notes.trim() || null,
        items,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/invoices/${id}`);
        },
      },
    );
  };

  const isLoading = loading || clientsLoading || currenciesLoading;

  if (!id) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">{t("dashboard.invoices.detail.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/invoices">{t("dashboard.common.backToInvoices")}</Link>
        </Button>
      </div>
    );
  }

  if (invoice.status !== "draft") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">{t("dashboard.invoices.edit.draftOnly")}</p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/invoices/${id}`}>{t("dashboard.common.viewInvoice")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("dashboard.invoices.edit.title", { invoiceNumber: invoice.invoice_number })}
          </h1>
          <p className="text-muted-foreground text-sm">{t("dashboard.invoices.edit.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.common.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dashboard.invoices.form.clientRequired")}</Label>
                <ClientPickerDialog
                  businessId={invoice?.business_id ?? null}
                  value={clientId}
                  onChange={setClientId}
                  clients={clients}
                  refetchClients={refetchClients}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("dashboard.invoices.form.issueDateRequired")}</Label>
                  <DatePicker
                    value={issueDate}
                    onChange={setIssueDate}
                    placeholder={t("dashboard.invoices.form.issueDatePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("dashboard.invoices.form.dueDateRequired")}</Label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder={t("dashboard.invoices.form.dueDatePlaceholder")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dashboard.invoices.form.linkQuotation")}</Label>
                <Select
                  value={quotationId ?? "none"}
                  onValueChange={(v) => setQuotationId(v === "none" ? null : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("dashboard.common.none")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("dashboard.common.none")}</SelectItem>
                    {quotations.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.quotation_number} — {q.client?.name ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("dashboard.common.currency")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("dashboard.common.lineItems")}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductPickerOpen(true)}
              >
                <Plus className="mr-1 size-4" />
                {t("dashboard.common.addItem")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {t("dashboard.invoices.edit.lineItemsEmpty")}
                </p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>{t("dashboard.common.description")}</Label>
                      <Input readOnly value={item.description} className="bg-muted" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-5.5 shrink-0"
                      onClick={() => removeItem(idx)}
                      title={t("dashboard.common.removeItem")}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.qtyRequired")}</Label>
                      <Input
                        type="number"
                        min={1}
                        step="any"
                        value={item.quantity || ""}
                        placeholder="0"
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.unitPrice")}</Label>
                      <Input
                        type="number"
                        min={item.base_price ?? 0}
                        step="any"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.discount")}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.discount === 0 ? "" : item.discount}
                        placeholder="0"
                        onChange={(e) => updateItem(idx, "discount", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashboard.common.lineTotal")}</Label>
                      <Input
                        readOnly
                        tabIndex={-1}
                        value={(
                          item.quantity * item.unit_price -
                          (item.discount ?? 0)
                        ).toLocaleString()}
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  {!itemMeetsMinimumPrice(item) && (
                    <p className="text-destructive text-sm">
                      {t("dashboard.common.belowBasePriceError", {
                        amount: Number(item.base_price ?? 0).toLocaleString(),
                      })}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductPickerDialog
            businessId={invoice?.business_id ?? null}
            businessName={invoice?.business?.name ?? null}
            products={products}
            refetchProducts={refetchProducts}
            onAddLine={addItemFromProduct}
            open={productPickerOpen}
            onOpenChange={setProductPickerOpen}
          />

          {/* Notes & Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.common.notesCustomization")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dashboard.common.notes")}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("dashboard.invoices.form.notesPlaceholder")}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.common.footerNote")}</Label>
                <Textarea
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  placeholder={t("dashboard.invoices.form.footerNotePlaceholder")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.common.accentColor")}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor || "#2563eb"}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border p-0.5"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("dashboard.invoices.form.accentColorHint")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary + Template */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("dashboard.common.template")}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="mr-2 size-4" />
                {t("dashboard.common.preview")}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setTemplateId(tmpl.id)}
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    templateId === tmpl.id
                      ? "border-primary bg-primary/5"
                      : "bg-muted/50 hover:border-primary/30 border-transparent"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {t(`dashboard.invoices.templates.${tmpl.id}.name`)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t(`dashboard.invoices.templates.${tmpl.id}.description`)}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.common.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("dashboard.common.totalDiscount")}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("dashboard.common.subtotal")}</span>
                <span className="font-medium">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground shrink-0">{t("dashboard.common.taxPercent")}</span>
                <div className="relative w-28">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0"
                    className="h-8 pr-7 text-right"
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs">
                    %
                  </span>
                </div>
              </div>
              {taxAmount > 0 && (
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>{t("dashboard.common.taxAmount")}</span>
                  <span>{taxAmount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>{t("dashboard.common.total")}</span>
                <span>
                  {currency} {total.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  isLoading={updateInvoice.isPending}
                >
                  {t("dashboard.common.saveChanges")}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                  {t("dashboard.common.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TemplateFullscreenPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={t("dashboard.invoices.form.previewDialogTitle")}
      >
        <InvoiceTemplate {...previewProps} />
      </TemplateFullscreenPreviewDialog>
    </div>
  );
};

export default EditInvoicePage;
