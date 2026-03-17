import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";
import { BusinessLogo } from "./business-logo";
import { QuotationAcceptanceSection } from "./quotation-acceptance-section";

export const ReceiptTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, documentType, currency, subtotal, totalDiscount, tax, taxPercent, total, notes, footerNote, scopeOfWork, business, client, items, isPaid } = props;
  const isQuotation = documentType === "quotation";
  const dateLabel = isQuotation ? "Valid Until" : "Due";
  const taxLabel = Number(tax) > 0 && (taxPercent != null && taxPercent > 0) ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)` : "Tax";

  return (
    <div className="bg-white text-gray-900 max-w-md mx-auto rounded-lg border border-dashed border-gray-300 overflow-hidden">
      {/* Header */}
      <div className="text-center px-6 pt-8 pb-4">
        <div className="mb-2">
          <BusinessLogo business={business} imageClassName="h-10 w-auto mx-auto" textClassName="text-xl font-bold" />
        </div>
        {business?.address && <p className="text-xs text-gray-500 mt-1">{business.address}</p>}
        {business?.tax_number && <p className="text-xs text-gray-400">TIN: {business.tax_number}</p>}
      </div>

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Invoice/Quotation info */}
      <div className="px-6 py-4 text-center">
        <p className="text-lg font-bold">{invoiceNumber}</p>
        <p className="text-xs text-gray-400 mt-1">
          {dayjs(issueDate).format("MMM D, YYYY")} — {dateLabel} {dayjs(dueDate).format("MMM D, YYYY")}
        </p>
        <div className="mt-2">
          {isQuotation ? (
            status === "accepted" ? (
              <span className="text-xs font-bold text-emerald-600">ACCEPTED</span>
            ) : status === "expired" ? (
              <span className="text-xs font-bold text-amber-600">EXPIRED</span>
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase">{status}</span>
            )
          ) : isPaid ? (
            <span className="text-xs font-bold text-emerald-600">PAID</span>
          ) : status === "overdue" ? (
            <span className="text-xs font-bold text-red-600">OVERDUE</span>
          ) : (
            <span className="text-xs font-bold text-gray-500 uppercase">{status}</span>
          )}
        </div>
      </div>

      {/* Scope of work (quotation only) */}
      {isQuotation && scopeOfWork && (
        <>
          <div className="border-t border-dashed border-gray-300 mx-4" />
          <div className="px-6 py-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Scope of Work</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{scopeOfWork}</p>
          </div>
        </>
      )}

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Client */}
      <div className="px-6 pb-3 text-center">
        <p className="text-xs text-gray-400">{isQuotation ? "Prepared for" : "Billed to"}</p>
        <p className="font-medium text-sm">{client?.name}</p>
        {client?.email && <p className="text-xs text-gray-500">{client.email}</p>}
      </div>

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Items */}
      <div className="px-6 py-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
            <div className="flex-1 min-w-0">
              <p className="truncate">{item.description}</p>
              <p className="text-xs text-gray-400">
                {Number(item.quantity)} × {Number(item.unit_price).toLocaleString()}
                {Number(item.discount ?? 0) > 0 && (
                  <span className="text-green-600 ml-1">−{Number(item.discount).toLocaleString()} discount</span>
                )}
              </p>
            </div>
            <p className="font-medium ml-4 shrink-0">{Number(item.total).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Totals */}
      <div className="px-6 py-4 space-y-1">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
        {Number(totalDiscount ?? 0) > 0 && (
          <div className="flex justify-between text-sm text-green-600"><span className="text-gray-500">Discount</span><span>-{Number(totalDiscount).toLocaleString()}</span></div>
        )}
        {Number(tax) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{taxLabel}</span><span>{Number(tax).toLocaleString()}</span></div>}
        <div className="border-t border-dashed border-gray-300 my-2" />
        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{currency} {Number(total).toLocaleString()}</span></div>
      </div>

      {/* Notes */}
      {notes && (
        <>
          <div className="border-t border-dashed border-gray-300 mx-4" />
          <div className="px-6 py-4 text-center">
            <p className="text-xs text-gray-500 whitespace-pre-wrap">{notes}</p>
          </div>
        </>
      )}

      {/* Quotation acceptance section */}
      {isQuotation && (
        <>
          <div className="border-t border-dashed border-gray-300 mx-4" />
          <div className="px-6 py-4">
            <QuotationAcceptanceSection />
          </div>
        </>
      )}

      {/* Footer Note */}
      <div className="px-6 pb-6 pt-2 text-center">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest">
          {footerNote || "Thank you for your business"}
        </p>
      </div>
    </div>
  );
};
