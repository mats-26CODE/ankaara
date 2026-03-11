"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClients } from "@/hooks/use-clients";
import { useBusinesses, type Business } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import { useCreateInvoice, type InvoiceItemInput } from "@/hooks/use-invoices";
import { useCurrencies } from "@/hooks/use-currencies";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";

const emptyItem = (): InvoiceItemInput => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

const CreateInvoicePage = () => {
  const router = useRouter();
  const { businesses, loading: bizLoading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();
  const { clients, loading: clientsLoading } = useClients(currentBusinessId);
  const { currencies, loading: currenciesLoading } = useCurrencies();
  const createInvoice = useCreateInvoice();

  const currentBusiness = useMemo(
    () =>
      businesses.find((b) => b.id === currentBusinessId) as
        | Business
        | undefined,
    [businesses, currentBusinessId],
  );

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueDate, setDueDate] = useState(
    dayjs().add(14, "day").format("YYYY-MM-DD"),
  );
  const [currency, setCurrency] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemInput[]>([emptyItem()]);

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  useEffect(() => {
    if (currentBusiness?.currency && !currency) {
      setCurrency(currentBusiness.currency);
    }
  }, [currentBusiness, currency]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items],
  );
  const taxAmount = Number(tax) || 0;
  const total = subtotal + taxAmount;

  const updateItem = (
    index: number,
    field: keyof InvoiceItemInput,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
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
    items.every(
      (item) =>
        item.description.trim() && item.quantity > 0 && item.unit_price > 0,
    );

  const handleSubmit = () => {
    if (!canSubmit || !currentBusinessId) return;

    createInvoice.mutate(
      {
        organization_id: currentBusinessId,
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        tax: taxAmount,
        notes: notes.trim() || undefined,
        items,
      },
      {
        onSuccess: (invoice) => {
          router.push(`/dashboard/invoices/${invoice.id}`);
        },
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
    <div className="space-y-6 max-w-4xl">
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
          <p className="text-sm text-muted-foreground">
            Create an invoice for {currentBusiness?.name ?? "your business"}.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Dates */}
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
                {clients.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No clients yet.{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/clients")}
                      className="underline hover:text-foreground"
                    >
                      Add a client first
                    </button>
                    .
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issue-date">Issue Date *</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date *</Label>
                  <Input
                    id="due-date"
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
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
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
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
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
                          updateItem(
                            idx,
                            "quantity",
                            Number(e.target.value) || 0,
                          )
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
                          updateItem(
                            idx,
                            "unit_price",
                            Number(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        readOnly
                        tabIndex={-1}
                        value={(
                          item.quantity * item.unit_price
                        ).toLocaleString()}
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
                  disabled={!canSubmit || createInvoice.isPending}
                >
                  {createInvoice.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    "Create Invoice"
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

export default CreateInvoicePage;
