import type { TemplateBusinessInfo, TemplateClientInfo, TemplateLineItem } from "@/lib/invoice-templates/types";

export type QuotationTemplateProps = {
  quotationNumber: string;
  status: string;
  issueDate: string;
  validUntil: string | null;
  currency: string;
  subtotal: number;
  totalDiscount?: number;
  tax: number;
  taxPercent?: number | null;
  total: number;
  notes: string | null;
  accentColor?: string | null;
  footerNote?: string | null;
  scopeOfWork?: string | null;
  business: TemplateBusinessInfo | null;
  client: TemplateClientInfo | null;
  items: TemplateLineItem[];
};

export type QuotationTemplateId =
  | "classic"
  | "modern-minimal"
  | "bold-brand"
  | "service"
  | "receipt"
  | "proposal";

export type QuotationTemplateMeta = {
  id: QuotationTemplateId;
  name: string;
  description: string;
};

export const QUOTATION_TEMPLATES: QuotationTemplateMeta[] = [
  { id: "classic", name: "Classic", description: "Traditional professional layout with clean lines and structure" },
  { id: "modern-minimal", name: "Modern Minimal", description: "Clean whitespace, light borders, and modern typography" },
  { id: "bold-brand", name: "Bold Brand", description: "Prominent brand color header with bold, impactful design" },
  { id: "service", name: "Service", description: "Optimized for service businesses with detailed breakdowns" },
  { id: "receipt", name: "Receipt", description: "Compact receipt-style layout ideal for quick transactions" },
  { id: "proposal", name: "Proposal", description: "Sales-focused with scope of work, validity, and acceptance section" },
];
