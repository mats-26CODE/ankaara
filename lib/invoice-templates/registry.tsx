import type { InvoiceTemplateProps, TemplateId } from "./types";
import { ClassicTemplate } from "@/components/invoice-templates/classic";
import { ModernMinimalTemplate } from "@/components/invoice-templates/modern-minimal";
import { BoldBrandTemplate } from "@/components/invoice-templates/bold-brand";
import { ServiceTemplate } from "@/components/invoice-templates/service";
import { ReceiptTemplate } from "@/components/invoice-templates/receipt";

type TemplateComponent = (props: InvoiceTemplateProps) => React.JSX.Element;

const registry: Record<TemplateId, TemplateComponent> = {
  classic: ClassicTemplate,
  "modern-minimal": ModernMinimalTemplate,
  "bold-brand": BoldBrandTemplate,
  service: ServiceTemplate,
  receipt: ReceiptTemplate,
};

export const getTemplateComponent = (id: string): TemplateComponent =>
  registry[id as TemplateId] ?? registry.classic;

export const InvoiceTemplate = ({
  templateId,
  ...props
}: InvoiceTemplateProps & { templateId: string }) => {
  const Component = getTemplateComponent(templateId);
  return <Component {...props} />;
};
