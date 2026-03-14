"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TEMPLATES,
  type TemplateId,
  type TemplateBusinessInfo,
} from "@/lib/invoice-templates/types";
import { InvoiceTemplate } from "@/lib/invoice-templates/registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCurrentBusinessId } from "@/lib/stores/business-store";

const FALLBACK_BUSINESS: TemplateBusinessInfo = {
  name: "Ankaara Labs",
  address: "123 Business Ave, Dar es Salaam",
  logo_url: null,
  logo_text: "Ankaara Labs",
  tax_number: "TIN-12345678",
  brand_color: "#2563eb",
  currency: "TZS",
};

const SAMPLE_DATA = {
  invoiceNumber: "INV-001",
  status: "sent",
  issueDate: "2026-03-01",
  dueDate: "2026-03-15",
  currency: "TZS",
  subtotal: 250000,
  tax: 45000,
  taxPercent: 18,
  total: 295000,
  notes: "Thank you for your business. Payment due within 14 days.",
  accentColor: null,
  footerNote: "We appreciate your trust in our services.",
  isPaid: false,
  client: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+255 712 345 678",
    address: "456 Client St, Arusha",
  },
  items: [
    {
      id: "1",
      description: "Web Development - Homepage",
      quantity: 1,
      unit_price: 150000,
      total: 150000,
    },
    {
      id: "2",
      description: "UI/UX Design",
      quantity: 2,
      unit_price: 50000,
      total: 100000,
    },
  ],
};

const TemplateSettingsPage = () => {
  const [previewId, setPreviewId] = useState<TemplateId>("classic");
  const { businesses, loading } = useBusinesses();
  const { currentBusinessId, setCurrentBusiness } = useCurrentBusinessId();

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId],
  );

  useEffect(() => {
    if (!currentBusinessId && businesses.length > 0) {
      setCurrentBusiness(businesses[0].id);
    }
  }, [businesses, currentBusinessId, setCurrentBusiness]);

  const previewBusiness: TemplateBusinessInfo = useMemo(() => {
    if (!activeBusiness) return FALLBACK_BUSINESS;
    return {
      name: activeBusiness.name,
      address: activeBusiness.address ?? null,
      logo_url: activeBusiness.logo_url ?? null,
      logo_text: activeBusiness.logo_text ?? null,
      tax_number: activeBusiness.tax_number ?? null,
      brand_color: activeBusiness.brand_color ?? null,
      currency: activeBusiness.currency,
    };
  }, [activeBusiness]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Invoice Templates</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose and preview invoice templates. Select a template when creating invoices.
        </p>
      </div>

      {/* Template selector grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TEMPLATES.map((tmpl) => (
          <Card
            key={tmpl.id}
            className={`relative cursor-pointer transition-all ${
              previewId === tmpl.id
                ? "ring-primary shadow-md ring-2"
                : "hover:ring-primary/40 hover:ring-1"
            }`}
            onClick={() => setPreviewId(tmpl.id)}
          >
            {previewId === tmpl.id && (
              <Badge className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full p-0">
                <Check className="size-3" />
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-sm">{tmpl.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">{tmpl.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live preview */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">
          Preview: {TEMPLATES.find((t) => t.id === previewId)?.name}
        </h3>
        <div className="bg-muted/30 overflow-auto rounded-xl border p-4 sm:p-6">
          <div className="mx-auto max-w-3xl">
            <InvoiceTemplate templateId={previewId} {...SAMPLE_DATA} business={previewBusiness} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSettingsPage;
