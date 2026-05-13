import type { InvoiceStatus } from "@/hooks/use-invoices";

/** Invoice must be out of draft and not cancelled/overdue to convert to a sale. */
export const INVOICE_STATUSES_ELIGIBLE_FOR_SALE_CONVERSION: readonly InvoiceStatus[] = [
  "sent",
  "viewed",
  "paid",
];

export const invoiceEligibleForSaleConversion = (status: InvoiceStatus): boolean =>
  INVOICE_STATUSES_ELIGIBLE_FOR_SALE_CONVERSION.includes(status);

export const canConvertInvoiceToSale = (
  status: InvoiceStatus,
  hasLinkedSale: boolean,
): boolean => invoiceEligibleForSaleConversion(status) && !hasLinkedSale;
