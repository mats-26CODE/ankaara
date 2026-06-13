import type { Invoice, InvoiceItem } from "@/hooks/use-invoices";

export const canShareInvoice = (
  invoice: Pick<
    Invoice,
    "status" | "client_id" | "issue_date" | "due_date" | "currency" | "total"
  >,
  items?: Pick<InvoiceItem, "description" | "quantity" | "unit_price">[],
) => {
  if (invoice.status !== "draft") return true;

  if (!invoice.client_id || !invoice.issue_date || !invoice.due_date || !invoice.currency) {
    return false;
  }

  if (items && items.length > 0) {
    return items.every(
      (item) =>
        !!String(item.description).trim() &&
        Number(item.quantity) > 0 &&
        Number(item.unit_price) > 0,
    );
  }

  return Number(invoice.total) > 0;
};
