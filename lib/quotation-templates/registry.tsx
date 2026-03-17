import type { QuotationTemplateProps, QuotationTemplateId } from "./types";
import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import { ClassicTemplate } from "@/components/invoice-templates/classic";
import { ModernMinimalTemplate } from "@/components/invoice-templates/modern-minimal";
import { BoldBrandTemplate } from "@/components/invoice-templates/bold-brand";
import { ServiceTemplate } from "@/components/invoice-templates/service";
import { ReceiptTemplate } from "@/components/invoice-templates/receipt";
import { ProposalTemplate } from "@/components/invoice-templates/proposal";

type TemplateComponent = (props: InvoiceTemplateProps) => React.JSX.Element;

const registry: Record<QuotationTemplateId, TemplateComponent> = {
  classic: ClassicTemplate,
  "modern-minimal": ModernMinimalTemplate,
  "bold-brand": BoldBrandTemplate,
  service: ServiceTemplate,
  receipt: ReceiptTemplate,
  proposal: ProposalTemplate,
};

const toInvoiceProps = (p: QuotationTemplateProps): InvoiceTemplateProps => ({
  invoiceNumber: p.quotationNumber,
  status: p.status,
  issueDate: p.issueDate,
  dueDate: p.validUntil ?? p.issueDate,
  documentType: "quotation",
  currency: p.currency,
  subtotal: p.subtotal,
  totalDiscount: p.totalDiscount,
  tax: p.tax,
  taxPercent: p.taxPercent,
  total: p.total,
  notes: p.notes,
  accentColor: p.accentColor,
  footerNote: p.footerNote,
  scopeOfWork: p.scopeOfWork,
  business: p.business,
  client: p.client,
  items: p.items,
  isPaid: false,
});

export const getQuotationTemplateComponent = (id: string): TemplateComponent =>
  registry[id as QuotationTemplateId] ?? registry.classic;

export const QuotationTemplate = ({
  templateId,
  ...props
}: QuotationTemplateProps & { templateId: string }) => {
  const Component = getQuotationTemplateComponent(templateId);
  return <Component {...toInvoiceProps(props)} />;
};
