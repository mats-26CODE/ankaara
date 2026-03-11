"use client";

import { use, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvoice, useUpdateInvoice, type InvoiceItemInput } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const emptyItem = (): InvoiceItemInput => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

const EditInvoicePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { invoice, loading } = useInvoice(id);
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const updateInvoice = useUpdateInvoice();

  const { clients, loading: clientsLoading } = useClients(
    invoice?.organization_id ?? null
  );

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [items, setItems] = useState<InvoiceItemInput[]>([]);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !invoice) return;
    setClientId(invoice.client_id);
    setIssueDate(invoice.issue_date);
    setDueDate(invoice.due_date);
    setCurrency(invoice.currency);
    setTax(String(Number(invoice.tax) || ""));
    setNotes(invoice.notes ?? "");
    setTemplateId((invoice.template_id as TemplateId) || "classic");
    setItems(
      (invoice.items ?? []).map((item) => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }))
    );
    setPrefilled(true);
  }, [invoice, prefilled]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items]
  );
  const taxAmount = Number(tax) || 0;
  const total = subtotal + taxAmount;

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const canSubmit =
    !!clientId &&
    !!issueDate &&
    !!dueDate &&
    !!currency &&
    items.length > 0 &&
    items.every((item) => item.description.trim() && item.quantity > 0 && item.unit_price > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    updateInvoice.mutate(
      {
        id,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        tax: taxAmount,
        template_id: templateId,
        notes: notes.trim() || null,
        items,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/invoices/${id}`);
        },
      }
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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  if (invoice.status !== "draft") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-muted-foreground">
          Only draft invoices can be edited.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/invoices/${id}`}>View Invoice</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit {invoice.invoice_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Update this draft invoice.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-issue-date">Issue Date *</Label>
                  <Input
                    id="edit-issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Due Date *</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        className="shrink-0 mt-6"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="size-4 text-destructive" />
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
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(idx, "unit_price", Number(e.target.value) || 0)
                        }
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

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or payment instructions..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary + Template */}
        <div className="space-y-6">
          {/* Template Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setTemplateId(tmpl.id)}
                  className={`text-left rounded-lg border-2 p-3 transition-colors ${
                    templateId === tmpl.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-medium">{tmpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tmpl.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="text-muted-foreground shrink-0">Tax</span>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0"
                  className="w-28 text-right h-8"
                />
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>
                  {currency} {total.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!canSubmit || updateInvoice.isPending}
                >
                  {updateInvoice.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditInvoicePage;
