import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";
import { BusinessLogo } from "./business-logo";
import { QuotationAcceptanceSection } from "./quotation-acceptance-section";

export const ModernMinimalTemplate = (props: InvoiceTemplateProps) => {
  const {
    invoiceNumber,
    status,
    issueDate,
    dueDate,
    documentType,
    currency,
    subtotal,
    totalDiscount,
    tax,
    taxPercent,
    total,
    notes,
    footerNote,
    scopeOfWork,
    business,
    client,
    items,
    isPaid,
  } = props;
  const isQuotation = documentType === "quotation";
  const docLabel = isQuotation ? "Quotation" : "Invoice";
  const dateLabel = isQuotation ? "Valid Until" : "Due";
  const showDiscountCol = items.some((i) => Number(i.discount ?? 0) > 0);
  const taxLabel =
    Number(tax) > 0 && taxPercent != null && taxPercent > 0
      ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)`
      : "Tax";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white text-gray-800"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="px-8 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium tracking-widest text-gray-400 uppercase">{docLabel}</p>
            <h1 className="mt-1 text-4xl font-extralight tracking-tight text-gray-900">
              {invoiceNumber}
            </h1>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <BusinessLogo
                business={business}
                imageClassName="h-8 w-auto ml-auto"
                textClassName="text-lg font-semibold"
              />
            </div>
            {business?.address && <p className="mt-1 text-xs text-gray-400">{business.address}</p>}
          </div>
        </div>
      </div>

      {/* Scope of work (quotation only) */}
      {isQuotation && scopeOfWork && (
        <div className="border-y border-gray-100 px-8 py-5">
          <p className="mb-2 text-[10px] tracking-widest text-gray-400 uppercase">Scope of Work</p>
          <p className="text-sm whitespace-pre-wrap text-gray-600">{scopeOfWork}</p>
        </div>
      )}

      {/* Status + Dates strip */}
      <div className="flex items-center justify-between border-y border-gray-100 px-8 py-4">
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">Issued</p>
            <p className="text-sm font-medium">{dayjs(issueDate).format("MMM D, YYYY")}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-gray-400 uppercase">{dateLabel}</p>
            <p className="text-sm font-medium">{dayjs(dueDate).format("MMM D, YYYY")}</p>
          </div>
        </div>
        <div>
          {isQuotation ? (
            status === "accepted" ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Accepted</span>
            ) : status === "expired" ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Expired</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 capitalize">{status}</span>
            )
          ) : isPaid ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Paid</span>
          ) : status === "overdue" ? (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Overdue</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 capitalize">{status}</span>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="px-8 py-6">
        <p className="mb-2 text-[10px] tracking-widest text-gray-400 uppercase">Billed To</p>
        <p className="font-medium">{client?.name}</p>
        <div className="space-y-0.5 text-sm text-gray-400">
          {client?.email && <p>{client.email}</p>}
          {client?.phone && <p>{client.phone}</p>}
          {client?.address && <p>{client.address}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="px-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                Description
              </th>
              <th className="w-16 pb-3 text-right text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                Qty
              </th>
              <th className="w-24 pb-3 text-right text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                Rate
              </th>
              {showDiscountCol && (
                <th className="w-20 pb-3 text-right text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                  Discount
                </th>
              )}
              <th className="w-24 pb-3 text-right text-[10px] font-medium tracking-widest text-gray-400 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-4">{item.description}</td>
                <td className="py-4 text-right text-gray-500">{Number(item.quantity)}</td>
                <td className="py-4 text-right text-gray-500">
                  {Number(item.unit_price).toLocaleString()}
                </td>
                {showDiscountCol && (
                  <td className="py-4 text-right text-gray-500">
                    {Number(item.discount ?? 0) > 0 ? `-${Number(item.discount).toLocaleString()}` : "—"}
                  </td>
                )}
                <td className="py-4 text-right font-medium">
                  {Number(item.total).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end px-8 py-8">
        <div className="w-56 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{Number(subtotal).toLocaleString()}</span>
          </div>
          {Number(totalDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{Number(totalDiscount).toLocaleString()}</span>
            </div>
          )}
          {Number(tax) > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>{taxLabel}</span>
              <span>{Number(tax).toLocaleString()}</span>
            </div>
          )}
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-2xl font-light">
                {currency} {Number(total).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-8 pb-8">
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="mb-2 text-[10px] tracking-widest text-gray-400 uppercase">Notes</p>
            <p className="text-sm whitespace-pre-wrap text-gray-600">{notes}</p>
          </div>
        </div>
      )}

      {/* Quotation acceptance section */}
      {isQuotation && (
        <div className="border-t border-gray-100 px-8 pb-8 pt-6">
          <QuotationAcceptanceSection />
        </div>
      )}

      {/* Footer Note */}
      {footerNote && (
        <div className="px-8 pb-8 text-center">
          <p className="text-xs whitespace-pre-wrap text-gray-400">{footerNote}</p>
        </div>
      )}
    </div>
  );
};
