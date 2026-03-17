/**
 * Proposal template: quotation-specific, sales-focused layout with
 * prominent validity period, scope of work, and acceptance section.
 * Used only for quotations.
 */
import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";
import { BusinessLogo } from "./business-logo";
import { QuotationAcceptanceSection } from "./quotation-acceptance-section";

const DEFAULT_BRAND = "#2563eb";

export const ProposalTemplate = (props: InvoiceTemplateProps) => {
  const {
    invoiceNumber,
    status,
    issueDate,
    dueDate,
    currency,
    subtotal,
    totalDiscount,
    tax,
    taxPercent,
    total,
    notes,
    accentColor,
    footerNote,
    scopeOfWork,
    business,
    client,
    items,
  } = props;
  const showDiscountCol = items.some((i) => Number(i.discount ?? 0) > 0);
  const taxLabel =
    Number(tax) > 0 && taxPercent != null && taxPercent > 0
      ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)`
      : "Tax";
  const brand = accentColor || business?.brand_color || DEFAULT_BRAND;

  return (
    <div className="overflow-hidden rounded-xl bg-white text-gray-900 shadow-sm">
      {/* Hero header with prominent validity */}
      <div className="relative px-8 py-10 text-white" style={{ backgroundColor: brand }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3">
              <BusinessLogo
                business={business}
                imageClassName="h-10 w-auto"
                textClassName="text-2xl font-bold text-white"
                invertImage
              />
            </div>
            {business?.address && <p className="mt-1 text-sm opacity-80">{business.address}</p>}
            {business?.tax_number && (
              <p className="text-xs opacity-60">TIN: {business.tax_number}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium tracking-wider uppercase opacity-70">Quotation</p>
            <p className="mt-1 text-3xl font-black">{invoiceNumber}</p>
          </div>
        </div>
        {/* Prominent validity banner */}
        <div className="mt-6 flex items-center justify-between rounded-lg bg-white/15 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">Issue Date</p>
            <p className="text-lg font-bold">{dayjs(issueDate).format("MMMM D, YYYY")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">Valid Until</p>
            <p className="text-lg font-bold">{dayjs(dueDate).format("MMMM D, YYYY")}</p>
          </div>
          <div>
            {status === "accepted" ? (
              <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold text-white">
                ACCEPTED
              </span>
            ) : status === "expired" ? (
              <span className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white">
                EXPIRED
              </span>
            ) : (
              <span className="rounded-full border-2 border-white/60 px-4 py-1.5 text-xs font-bold uppercase">
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scope of work - always shown for proposal (placeholder if empty) */}
      <div className="border-b border-gray-200 px-8 py-6">
        <p className="mb-2 text-xs font-bold tracking-wider uppercase" style={{ color: brand }}>
          Scope of Work
        </p>
        <p className="text-sm whitespace-pre-wrap text-gray-600">
          {scopeOfWork || "Deliverables and services as described in the items below."}
        </p>
      </div>

      {/* Client */}
      <div className="px-8 py-6">
        <p className="mb-2 text-xs font-bold tracking-wider uppercase" style={{ color: brand }}>
          Prepared For
        </p>
        <p className="text-lg font-bold">{client?.name}</p>
        <div className="mt-1 space-y-0.5 text-sm text-gray-500">
          {client?.email && <p>{client.email}</p>}
          {client?.phone && <p>{client.phone}</p>}
          {client?.address && <p>{client.address}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="px-8">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: brand + "0D" }}>
              <th
                className="rounded-l-lg px-3 py-3 text-left text-xs font-bold tracking-wider uppercase"
                style={{ color: brand }}
              >
                Description
              </th>
              <th
                className="w-16 py-3 text-right text-xs font-bold tracking-wider uppercase"
                style={{ color: brand }}
              >
                Qty
              </th>
              <th
                className="w-28 py-3 text-right text-xs font-bold tracking-wider uppercase"
                style={{ color: brand }}
              >
                Price
              </th>
              {showDiscountCol && (
                <th
                  className="w-24 px-3 py-3 text-right text-xs font-bold tracking-wider uppercase"
                  style={{ color: brand }}
                >
                  Discount
                </th>
              )}
              <th
                className="w-28 rounded-r-lg px-3 py-3 text-right text-xs font-bold tracking-wider uppercase"
                style={{ color: brand }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-gray-50/50"}>
                <td className="px-3 py-3">{item.description}</td>
                <td className="py-3 text-right text-gray-600">{Number(item.quantity)}</td>
                <td className="py-3 text-right text-gray-600">
                  {Number(item.unit_price).toLocaleString()}
                </td>
                {showDiscountCol && (
                  <td className="px-3 py-3 text-right text-gray-500">
                    {Number(item.discount ?? 0) > 0
                      ? `-${Number(item.discount).toLocaleString()}`
                      : "—"}
                  </td>
                )}
                <td className="px-3 py-3 text-right font-bold">
                  {Number(item.total).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end px-8 py-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{Number(subtotal).toLocaleString()}</span>
          </div>
          {Number(totalDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="text-gray-500">Discount</span>
              <span>-{Number(totalDiscount).toLocaleString()}</span>
            </div>
          )}
          {Number(tax) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{taxLabel}</span>
              <span>{Number(tax).toLocaleString()}</span>
            </div>
          )}
          <div
            className="mt-2 flex items-baseline justify-between rounded-lg px-4 py-3 text-white"
            style={{ backgroundColor: brand }}
          >
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-black">
              {currency} {Number(total).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-8 pb-8">
          <p className="mb-2 text-xs font-bold tracking-wider uppercase" style={{ color: brand }}>
            Terms & Notes
          </p>
          <p className="text-sm whitespace-pre-wrap text-gray-600">{notes}</p>
        </div>
      )}

      {/* Acceptance section - prominent for proposal */}
      <div
        className="border-t-2 px-8 py-8"
        style={{ borderColor: brand + "40", backgroundColor: brand + "05" }}
      >
        <QuotationAcceptanceSection />
      </div>

      {/* Footer Note */}
      {footerNote && (
        <div className="px-8 pb-6 text-center">
          <p className="text-xs whitespace-pre-wrap" style={{ color: brand + "99" }}>
            {footerNote}
          </p>
        </div>
      )}
    </div>
  );
};
