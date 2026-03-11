"use client";

import { useState } from "react";
import { TEMPLATES, type TemplateId } from "@/lib/invoice-templates/types";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const SAMPLE_DATA = {
  invoiceNumber: "INV-001",
  status: "sent",
  issueDate: "2026-03-01",
  dueDate: "2026-03-15",
  currency: "TZS",
  subtotal: 250000,
  tax: 45000,
  total: 295000,
  notes: "Thank you for your business. Payment due within 14 days.",
  accentColor: null,
  footerNote: "We appreciate your trust in our services.",
  isPaid: false,
  business: {
    name: "Acme Corp",
    address: "123 Business Ave, Dar es Salaam",
    logo_url: null,
    logo_text: "Acme Corp",
    tax_number: "TIN-12345678",
    brand_color: "#2563eb",
    currency: "TZS",
  },
  client: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+255 712 345 678",
    address: "456 Client St, Arusha",
  },
  items: [
    { id: "1", description: "Web Development - Homepage", quantity: 1, unit_price: 150000, total: 150000 },
    { id: "2", description: "UI/UX Design", quantity: 2, unit_price: 50000, total: 100000 },
  ],
};

const TemplateSettingsPage = () => {
  const [previewId, setPreviewId] = useState<TemplateId>("classic");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Invoice Templates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose and preview invoice templates. Select a template when creating invoices.
        </p>
      </div>

      {/* Template selector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {TEMPLATES.map((tmpl) => (
          <Card
            key={tmpl.id}
            className={`cursor-pointer transition-all relative ${
              previewId === tmpl.id
                ? "ring-2 ring-primary shadow-md"
                : "hover:ring-1 hover:ring-primary/40"
            }`}
            onClick={() => setPreviewId(tmpl.id)}
          >
            {previewId === tmpl.id && (
              <Badge className="absolute -top-2 -right-2 size-6 p-0 flex items-center justify-center rounded-full">
                <Check className="size-3" />
              </Badge>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{tmpl.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{tmpl.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Preview: {TEMPLATES.find((t) => t.id === previewId)?.name}
        </h3>
        <div className="border rounded-xl p-4 sm:p-6 bg-muted/30 overflow-auto">
          <div className="mx-auto max-w-3xl">
            <InvoiceTemplate templateId={previewId} {...SAMPLE_DATA} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSettingsPage;
