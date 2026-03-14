import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";
import { BusinessLogo } from "./business-logo";

const StatusLabel = ({ status, isPaid }: { status: string; isPaid: boolean }) => {
  if (isPaid) return <span className="inline-block rounded bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">Paid</span>;
  if (status === "overdue") return <span className="inline-block rounded bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700">Overdue</span>;
  return <span className="inline-block rounded border px-3 py-1 text-xs font-bold uppercase text-gray-600">{status}</span>;
};

export const ClassicTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, currency, subtotal, tax, taxPercent, total, notes, accentColor, footerNote, business, client, items, isPaid } = props;
  const taxLabel = Number(tax) > 0 && (taxPercent != null && taxPercent > 0) ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)` : "Tax";

  return (
    <div className="bg-white text-gray-900 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="mb-2">
              <BusinessLogo business={business} imageClassName="h-10 w-auto" textClassName="text-xl font-bold text-gray-900" />
            </div>
            {business?.address && <p className="text-sm text-gray-500 mt-1">{business.address}</p>}
            {business?.tax_number && <p className="text-xs text-gray-400">TIN: {business.tax_number}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">{invoiceNumber}</h1>
            <div className="mt-2"><StatusLabel status={status} isPaid={isPaid} /></div>
          </div>
        </div>
      </div>

      {/* Billing + Dates */}
      <div className="grid grid-cols-2 gap-8 px-8 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Bill To</p>
          <p className="font-semibold">{client?.name}</p>
          {client?.email && <p className="text-sm text-gray-500">{client.email}</p>}
          {client?.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
          {client?.address && <p className="text-sm text-gray-500">{client.address}</p>}
        </div>
        <div className="text-right space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Issue Date</p>
            <p className="text-sm">{dayjs(issueDate).format("MMMM D, YYYY")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Due Date</p>
            <p className="text-sm">{dayjs(dueDate).format("MMMM D, YYYY")}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-8 pb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="py-3 text-left font-semibold text-gray-600">Description</th>
              <th className="py-3 text-right font-semibold text-gray-600 w-20">Qty</th>
              <th className="py-3 text-right font-semibold text-gray-600 w-28">Unit Price</th>
              <th className="py-3 text-right font-semibold text-gray-600 w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right">{Number(item.quantity)}</td>
                <td className="py-3 text-right">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-3 text-right font-medium">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-8 py-6 flex justify-end">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
          {Number(tax) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{taxLabel}</span><span>{Number(tax).toLocaleString()}</span></div>}
          <div className="border-t border-gray-300 my-2" />
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{currency} {Number(total).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="border-t border-gray-200 px-8 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap text-gray-600">{notes}</p>
        </div>
      )}

      {/* Footer Note */}
      {footerNote && (
        <div className="border-t border-gray-200 px-8 py-4 text-center" style={accentColor ? { backgroundColor: accentColor + "08" } : undefined}>
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{footerNote}</p>
        </div>
      )}
    </div>
  );
};
