import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";
import { BusinessLogo } from "./business-logo";

const DEFAULT_BRAND = "#2563eb";

export const BoldBrandTemplate = (props: InvoiceTemplateProps) => {
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
    business,
    client,
    items,
    isPaid,
  } = props;
  const showDiscountCol = items.some((i) => Number(i.discount ?? 0) > 0);
  const taxLabel =
    Number(tax) > 0 && taxPercent != null && taxPercent > 0
      ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)`
      : "Tax";
  const brand = accentColor || business?.brand_color || DEFAULT_BRAND;

  return (
    <div className="overflow-hidden rounded-xl bg-white text-gray-900 shadow-sm">
      {/* Colored header */}
      <div className="px-8 py-8 text-white" style={{ backgroundColor: brand }}>
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
            <p className="text-sm font-medium tracking-wider uppercase opacity-70">Invoice</p>
            <p className="mt-1 text-3xl font-black">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div
        className="flex items-center justify-between border-b px-8 py-4"
        style={{ borderColor: brand + "20" }}
      >
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: brand }}>
              Issue Date
            </p>
            <p className="text-sm">{dayjs(issueDate).format("MMM D, YYYY")}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: brand }}>
              Due Date
            </p>
            <p className="text-sm">{dayjs(dueDate).format("MMM D, YYYY")}</p>
          </div>
        </div>
        {isPaid ? (
          <span
            className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
            style={{ backgroundColor: "#059669" }}
          >
            PAID
          </span>
        ) : status === "overdue" ? (
          <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white">
            OVERDUE
          </span>
        ) : (
          <span
            className="rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase"
            style={{ borderColor: brand, color: brand }}
          >
            {status}
          </span>
        )}
      </div>

      {/* Bill to */}
      <div className="px-8 py-6">
        <p className="mb-2 text-xs font-bold tracking-wider uppercase" style={{ color: brand }}>
          Bill To
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
                  className="w-24 py-3 text-right text-xs font-bold tracking-wider uppercase px-3"
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
                    {Number(item.discount ?? 0) > 0 ? `-${Number(item.discount).toLocaleString()}` : "—"}
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
            Notes
          </p>
          <p className="text-sm whitespace-pre-wrap text-gray-600">{notes}</p>
        </div>
      )}

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
