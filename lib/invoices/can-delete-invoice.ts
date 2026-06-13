import type { InvoiceStatus } from "@/hooks/use-invoices";

export const canDeleteInvoice = (status: InvoiceStatus) => status !== "paid";

export const INVOICE_DELETE_PAID_BLOCKED =
  "Paid invoices cannot be deleted.";
