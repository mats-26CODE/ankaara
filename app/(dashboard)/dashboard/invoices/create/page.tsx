"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/use-clients";
import { useBusinesses, type Business } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useCreateInvoice, type InvoiceItemInput } from "@/hooks/use-invoices";
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
import { ClientPickerDialog } from "@/components/shared/client-picker-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, ArrowLeft, Eye } from "lucide-react";
import dayjs from "dayjs";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const emptyItem = (): InvoiceItemInput => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

const CreateInvoicePage = () => {
  const router = useRouter();
  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const {
    clients,
    loading: clientsLoading,
    refetch: refetchClients,
  } = useClients(currentBusinessId);
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const createInvoice = useCreateInvoice();

  const currentBusiness = useMemo(
    () => businesses.find((b) => b.id === currentBusinessId) as Business | undefined,
    [businesses, currentBusinessId],
  );

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueDate, setDueDate] = useState(dayjs().add(14, "day").format("YYYY-MM-DD"));
  const [currency, setCurrency] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [items, setItems] = useState<InvoiceItemInput[]>([emptyItem()]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savingMode, setSavingMode] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    if (currentBusiness?.currency && !currency) {
      setCurrency(currentBusiness.currency);
    }
    if (currentBusiness?.brand_color && !accentColor) {
      setAccentColor(currentBusiness.brand_color);
    }
  }, [currentBusiness, currency, accentColor]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items],
  );
  const taxPercent = Number(tax) || 0;
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount;

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const previewProps = useMemo(
    () => ({
      templateId,
      invoiceNumber: "INV-PREVIEW",
      status: "draft",
      issueDate,
      dueDate,
      currency: currency || "TZS",
      subtotal,
      tax: taxAmount,
      taxPercent: taxPercent || null,
      total,
      notes: notes || null,
      accentColor: accentColor.trim() || null,
      footerNote: footerNote.trim() || null,
      isPaid: false,
      business: currentBusiness
        ? {
            name: currentBusiness.name,
            address: currentBusiness.address ?? null,
            logo_url: currentBusiness.logo_url ?? null,
            logo_text: currentBusiness.logo_text ?? null,
            tax_number: currentBusiness.tax_number ?? null,
            brand_color: currentBusiness.brand_color ?? null,
            currency: currentBusiness.currency,
          }
        : null,
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
        total: item.quantity * item.unit_price,
      })),
    }),
    [
      templateId,
      issueDate,
      dueDate,
      currency,
      subtotal,
      taxAmount,
      taxPercent,
      total,
      notes,
      accentColor,
      footerNote,
      currentBusiness,
      selectedClient,
      items,
    ],
  );

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const canSubmit =
    !!currentBusinessId &&
    !!clientId &&
    !!issueDate &&
    !!dueDate &&
    !!currency &&
    items.length > 0 &&
    items.every((item) => item.description.trim() && item.quantity > 0 && item.unit_price > 0);

  const canSaveDraft =
    !!currentBusinessId &&
    !!clientId &&
    items.length > 0 &&
    items.some((item) => item.description.trim() || item.quantity !== 1 || item.unit_price > 0);

  const handleSubmit = () => {
    if (!canSubmit || !currentBusinessId) return;
    setSavingMode("submit");
    createInvoice.mutate(
      {
        business_id: currentBusinessId,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        tax: taxAmount,
        tax_percentage: taxPercent,
        template_id: templateId,
        accent_color: accentColor.trim() || undefined,
        footer_note: footerNote.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      },
      {
        onSuccess: (invoice) => {
          router.push(`/dashboard/invoices/${invoice.id}`);
        },
        onSettled: () => setSavingMode(null),
      },
    );
  };

  const handleSaveDraft = () => {
    if (!canSaveDraft || !currentBusinessId) return;
    setSavingMode("draft");
    createInvoice.mutate(
      {
        business_id: currentBusinessId,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        tax: taxAmount,
        tax_percentage: taxPercent,
        template_id: templateId,
        accent_color: accentColor.trim() || undefined,
        footer_note: footerNote.trim() || undefined,
        notes: notes.trim() || undefined,
        items,
      },
      {
        onSuccess: (invoice) => {
          router.push(`/dashboard/invoices/${invoice.id}`);
        },
        onSettled: () => setSavingMode(null),
      },
    );
  };

  const isLoading = bizLoading || clientsLoading || currenciesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground text-sm">
            Create an invoice for {currentBusiness?.name ?? "your business"}.
          </p>
        </div>
      </div>

      {/* Template selection + small preview */}
      <Card className="border-primary/80 gap-2 border shadow-xs">
        <CardHeader className="flex items-end justify-between pb-3">
          <div>
            <CardTitle className="text-base">Template</CardTitle>
            <p className="text-muted-foreground text-sm">
              Choose a template. The preview updates as you fill the form.
            </p>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed border-gray-300"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="mr-2 size-4" />
              See full preview
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setTemplateId(tmpl.id)}
                className={`min-w-[180px] rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                  templateId === tmpl.id
                    ? "border-primary bg-primary/5"
                    : "bg-muted/50 hover:border-primary/30 border-transparent"
                }`}
              >
                <p className="text-sm font-medium">{tmpl.name}</p>
                <p className="text-muted-foreground line-clamp-1 text-xs">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <ClientPickerDialog
                  businessId={currentBusinessId}
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
                  <Label>Due Date *</Label>
                  <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select due date" />
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
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 size-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Add at least one item to your invoice.
                </p>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Service or product description"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-6 shrink-0"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
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
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unit_price || ""}
                        placeholder="0"
                        onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        readOnly
                        tabIndex={-1}
                        value={(item.quantity * item.unit_price).toLocaleString()}
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes & Customization */}
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
                  placeholder="Additional notes or payment instructions..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Footer Note</Label>
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
                <p className="text-muted-foreground text-xs">
                  Overrides the business brand color for this invoice
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={!canSaveDraft}
                  isLoading={createInvoice.isPending && savingMode === "draft"}
                >
                  Save as Draft
                </Button>
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  isLoading={createInvoice.isPending && savingMode === "submit"}
                >
                  Create Invoice
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-[95vw] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Invoice preview</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30 flex-1 overflow-auto rounded-lg border p-4">
            <div className="w-full min-w-0 rounded-lg bg-white shadow-sm">
              <InvoiceTemplate {...previewProps} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoicePage;
