export type TemplateBusinessInfo = {
  name: string;
  address: string | null;
  logo_url: string | null;
  logo_text: string | null;
  tax_number: string | null;
  brand_color: string | null;
  currency: string;
};

export type TemplateClientInfo = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export type TemplateLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type InvoiceTemplateProps = {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  accentColor?: string | null;
  footerNote?: string | null;
  business: TemplateBusinessInfo | null;
  client: TemplateClientInfo | null;
  items: TemplateLineItem[];
  isPaid: boolean;
};

export type TemplateId =
  | "classic"
  | "modern-minimal"
  | "bold-brand"
  | "service"
  | "receipt";

export type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional professional layout with clean lines and structure",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean whitespace, light borders, and modern typography",
  },
  {
    id: "bold-brand",
    name: "Bold Brand",
    description: "Prominent brand color header with bold, impactful design",
  },
  {
    id: "service",
    name: "Service",
    description: "Optimized for service businesses with detailed breakdowns",
  },
  {
    id: "receipt",
    name: "Receipt",
    description: "Compact receipt-style layout ideal for quick transactions",
  },
];
