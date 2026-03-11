import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";

export const ServiceTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, currency, subtotal, tax, taxPercent, total, notes, footerNote, business, client, items, isPaid } = props;
  const taxLabel = Number(tax) > 0 && (taxPercent != null && taxPercent > 0) ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)` : "Tax";

  const renderLogo = () => {
    if (business?.logo_url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={business.logo_url} alt={business.name} className="h-8 w-auto mb-1" />;
    }
    if (business?.logo_text) {
      return <p className="font-bold text-gray-900">{business.logo_text}</p>;
    }
    return <p className="font-bold text-gray-900">{business?.name}</p>;
  };

  return (
    <div className="bg-white text-gray-900 rounded-lg border border-gray-200 overflow-hidden">
      {/* Compact header with two columns */}
      <div className="grid grid-cols-2 border-b border-gray-200">
        {/* Left — Business */}
        <div className="px-6 py-5 border-r border-gray-200">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">From</p>
          {renderLogo()}
          {business?.address && <p className="text-xs text-gray-500 mt-0.5">{business.address}</p>}
          {business?.tax_number && <p className="text-xs text-gray-400">TIN: {business.tax_number}</p>}
        </div>
        {/* Right — Client */}
        <div className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">To</p>
          <p className="font-bold text-gray-900">{client?.name}</p>
          {client?.email && <p className="text-xs text-gray-500">{client.email}</p>}
          {client?.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
          {client?.address && <p className="text-xs text-gray-500">{client.address}</p>}
        </div>
      </div>

      {/* Invoice meta row */}
      <div className="grid grid-cols-4 border-b border-gray-200 divide-x divide-gray-200 text-center">
        <div className="py-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Invoice #</p>
          <p className="text-sm font-bold mt-0.5">{invoiceNumber}</p>
        </div>
        <div className="py-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Issue Date</p>
          <p className="text-sm mt-0.5">{dayjs(issueDate).format("MMM D, YYYY")}</p>
        </div>
        <div className="py-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Due Date</p>
          <p className="text-sm mt-0.5">{dayjs(dueDate).format("MMM D, YYYY")}</p>
        </div>
        <div className="py-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Status</p>
          <p className="text-sm font-bold mt-0.5">
            {isPaid ? (
              <span className="text-emerald-600">Paid</span>
            ) : status === "overdue" ? (
              <span className="text-red-600">Overdue</span>
            ) : (
              <span className="capitalize">{status}</span>
            )}
          </p>
        </div>
      </div>

      {/* Service items */}
      <div className="px-6 py-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Services Provided</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="pb-2 text-left font-bold text-xs uppercase">#</th>
              <th className="pb-2 text-left font-bold text-xs uppercase">Service Description</th>
              <th className="pb-2 text-right font-bold text-xs uppercase w-16">Qty</th>
              <th className="pb-2 text-right font-bold text-xs uppercase w-24">Rate</th>
              <th className="pb-2 text-right font-bold text-xs uppercase w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-400 w-8">{idx + 1}</td>
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-right text-gray-600">{Number(item.quantity)}</td>
                <td className="py-3 text-right text-gray-600">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-3 text-right font-semibold">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
            {Number(tax) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{taxLabel}</span><span>{Number(tax).toLocaleString()}</span></div>}
            <div className="border-t-2 border-gray-900 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg"><span>Total Due</span><span>{currency} {Number(total).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-6 py-5 border-t border-gray-200">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Notes & Terms</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Footer Note */}
      {footerNote && (
        <div className="px-6 py-4 border-t border-gray-200 text-center bg-gray-50">
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{footerNote}</p>
        </div>
      )}
    </div>
  );
};
