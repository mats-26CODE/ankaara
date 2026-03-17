"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuotation, useUpdateQuotation, type QuotationItemInput } from "@/hooks/use-quotations";
import { useClients } from "@/hooks/use-clients";
import { useProducts } from "@/hooks/use-products";
import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import { ProductPickerDialog } from "@/components/shared/product-picker-dialog";
import { useCurrencies } from "@/hooks/use-currencies";
import { QUOTATION_TEMPLATES, type QuotationTemplateId } from "@/lib/quotation-templates/types";
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
import { QuotationTemplate } from "@/lib/quotation-templates/registry";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dayjs from "dayjs";

const EditQuotationPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { quotation, loading } = useQuotation(id);
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateQuotation = useUpdateQuotation();

  const {
    clients,
    loading: clientsLoading,
    refetch: refetchClients,
  } = useClients(quotation?.business_id ?? null);
  const { products, refetch: refetchProducts } = useProducts(quotation?.business_id ?? null);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [templateId, setTemplateId] = useState<QuotationTemplateId>("classic");
  const [items, setItems] = useState<QuotationItemInput[]>([]);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !quotation) return;
    setClientId(quotation.client_id);
    setIssueDate(quotation.issue_date);
    setValidUntil(quotation.valid_until ?? "");
    setCurrency(quotation.currency);
    const storedTax = Number(quotation.tax) || 0;
    const storedSubtotal = Number(quotation.subtotal) || 0;
    const pct =
      quotation.tax_percentage != null && Number(quotation.tax_percentage) >= 0
        ? Number(quotation.tax_percentage)
        : storedSubtotal > 0
          ? (storedTax / storedSubtotal) * 100
          : 0;
    setTax(pct ? String(Math.round(pct * 100) / 100) : "");
    setNotes(quotation.notes ?? "");
    setScopeOfWork(quotation.scope_of_work ?? "");
    setAccentColor(quotation.accent_color ?? "");
    setFooterNote(quotation.footer_note ?? "");
    setTemplateId((quotation.template_id as QuotationTemplateId) || "classic");
    setItems(
      (quotation.items ?? []).map((item) => ({
        product_id: item.product_id ?? undefined,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount) || 0,
      })),
    );
    setPrefilled(true);
  }, [quotation, prefilled]);

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

  const updateItem = (index: number, field: keyof QuotationItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItemFromProduct = (product: { id: string; name: string; unit_price: number }) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
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
      quotationNumber: quotation?.quotation_number ?? "QUO-PREVIEW",
      status: "draft",
      issueDate: issueDate || dayjs().format("YYYY-MM-DD"),
      validUntil: validUntil || null,
      currency: currency || "TZS",
      subtotal,
      totalDiscount: totalDiscount > 0 ? totalDiscount : undefined,
      tax: taxAmount,
      taxPercent: taxPercent || null,
      total,
      notes: notes || null,
      scopeOfWork: scopeOfWork.trim() || null,
      accentColor: accentColor.trim() || null,
      footerNote: footerNote.trim() || null,
      business: quotation?.business ?? null,
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
      quotation?.quotation_number,
      quotation?.business,
      issueDate,
      validUntil,
      currency,
      subtotal,
      totalDiscount,
      taxAmount,
      taxPercent,
      total,
      notes,
      scopeOfWork,
      accentColor,
      footerNote,
      selectedClient,
      items,
    ],
  );

  const canSubmit =
    !!clientId &&
    !!issueDate &&
    !!currency &&
    items.length > 0 &&
    items.every((item) => item.description.trim() && item.quantity > 0 && item.unit_price > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    updateQuotation.mutate(
      {
        id,
        client_id: clientId,
        issue_date: issueDate,
        valid_until: validUntil?.trim() || null,
        currency,
        tax: taxAmount,
        tax_percentage: taxPercent,
        template_id: templateId,
        accent_color: accentColor.trim() || null,
        footer_note: footerNote.trim() || null,
        notes: notes.trim() || null,
        scope_of_work: scopeOfWork.trim() || null,
        items,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/quotations/${id}`);
        },
      },
    );
  };

  const isLoading = loading || clientsLoading || currenciesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Quotation not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/quotations">Back to Quotations</Link>
        </Button>
      </div>
    );
  }

  if (quotation.status !== "draft") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Only draft quotations can be edited.</p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/quotations/${id}`}>View Quotation</Link>
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
          <h1 className="text-2xl font-bold tracking-tight">Edit {quotation.quotation_number}</h1>
          <p className="text-muted-foreground text-sm">Update this draft quotation.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <ClientPickerDialog
                  businessId={quotation?.business_id ?? null}
                  value={clientId}
                  onChange={setClientId}
                  clients={clients}
                  refetchClients={refetchClients}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Issue Date *</Label>
                  <DatePicker
                    value={issueDate}
                    onChange={setIssueDate}
                    placeholder="Select issue date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <DatePicker
                    value={validUntil}
                    onChange={setValidUntil}
                    placeholder="Optional expiry date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
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

              <div className="space-y-2">
                <Label>Scope of Work</Label>
                <Textarea
                  value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)}
                  placeholder="Describe deliverables, services, or project scope (optional)"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Line Items</CardTitle>
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
                  Add items from your products. Click &ldquo;Add item&rdquo; to select or create a
                  product.
                </p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Description</Label>
                      <Input readOnly value={item.description} className="bg-muted" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-5.5 shrink-0"
                      onClick={() => removeItem(idx)}
                      title="Remove item"
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Qty *</Label>
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
                      <Label>Unit Price</Label>
                      <Input
                        readOnly
                        value={Number(item.unit_price).toLocaleString()}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount</Label>
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
                      <Label>Line Total</Label>
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
                </div>
              ))}
            </CardContent>
          </Card>

          <ProductPickerDialog
            businessId={quotation?.business_id ?? null}
            businessName={quotation?.business?.name ?? null}
            products={products}
            refetchProducts={refetchProducts}
            onAddLine={addItemFromProduct}
            open={productPickerOpen}
            onOpenChange={setProductPickerOpen}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes & Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Note</Label>
                <Textarea
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  placeholder="e.g. Thank you for your business!"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Template</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="mr-2 size-4" />
                Preview
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {QUOTATION_TEMPLATES.map((tmpl) => (
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
                  <p className="text-sm font-medium">{tmpl.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{tmpl.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total discount</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground shrink-0">Tax (%)</span>
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
                  <span>Tax amount</span>
                  <span>{taxAmount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>
                  {currency} {total.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  isLoading={updateQuotation.isPending}
                >
                  Save Changes
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-[min(80vw,800px)] max-w-[min(80vw,800px)] flex-col overflow-hidden sm:max-w-[min(98vw,1400px)]">
          <DialogHeader>
            <DialogTitle>Quotation preview</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 flex-1 overflow-auto rounded-lg border p-4">
            <div className="w-full min-w-0 rounded-lg bg-white shadow-sm">
              <QuotationTemplate {...previewProps} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditQuotationPage;
