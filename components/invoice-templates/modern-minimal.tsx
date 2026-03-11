import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";

export const ModernMinimalTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, currency, subtotal, tax, taxPercent, total, notes, footerNote, business, client, items, isPaid } = props;
  const taxLabel = Number(tax) > 0 && (taxPercent != null && taxPercent > 0) ? `Tax (${Number(taxPercent) % 1 === 0 ? taxPercent : Number(taxPercent).toFixed(1)}%)` : "Tax";

  const renderLogo = () => {
    if (business?.logo_url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={business.logo_url} alt={business.name} className="h-8 w-auto ml-auto mb-2" />;
    }
    if (business?.logo_text) {
      return <p className="text-lg font-semibold">{business.logo_text}</p>;
    }
    return <p className="text-lg font-semibold">{business?.name}</p>;
  };

  return (
    <div className="bg-white text-gray-800 rounded-2xl overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-8 pt-10 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Invoice</p>
            <h1 className="text-4xl font-extralight tracking-tight text-gray-900 mt-1">{invoiceNumber}</h1>
          </div>
          <div className="text-right">
            {renderLogo()}
            {business?.address && <p className="text-xs text-gray-400 mt-1">{business.address}</p>}
          </div>
        </div>
      </div>

      {/* Status + Dates strip */}
      <div className="px-8 py-4 flex items-center justify-between border-y border-gray-100">
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Issued</p>
            <p className="text-sm font-medium">{dayjs(issueDate).format("MMM D, YYYY")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Due</p>
            <p className="text-sm font-medium">{dayjs(dueDate).format("MMM D, YYYY")}</p>
          </div>
        </div>
        <div>
          {isPaid ? (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Paid</span>
          ) : status === "overdue" ? (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">Overdue</span>
          ) : (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full capitalize">{status}</span>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="px-8 py-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Billed To</p>
        <p className="font-medium">{client?.name}</p>
        <div className="text-sm text-gray-400 space-y-0.5">
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
              <th className="pb-3 text-left text-[10px] uppercase tracking-widest text-gray-400 font-medium">Description</th>
              <th className="pb-3 text-right text-[10px] uppercase tracking-widest text-gray-400 font-medium w-16">Qty</th>
              <th className="pb-3 text-right text-[10px] uppercase tracking-widest text-gray-400 font-medium w-24">Rate</th>
              <th className="pb-3 text-right text-[10px] uppercase tracking-widest text-gray-400 font-medium w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-4">{item.description}</td>
                <td className="py-4 text-right text-gray-500">{Number(item.quantity)}</td>
                <td className="py-4 text-right text-gray-500">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-4 text-right font-medium">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-8 py-8 flex justify-end">
        <div className="w-56 space-y-2">
          <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
          {Number(tax) > 0 && <div className="flex justify-between text-sm text-gray-500"><span>{taxLabel}</span><span>{Number(tax).toLocaleString()}</span></div>}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-2xl font-light">{currency} {Number(total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-8 pb-8">
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
          </div>
        </div>
      )}

      {/* Footer Note */}
      {footerNote && (
        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-gray-400 whitespace-pre-wrap">{footerNote}</p>
        </div>
      )}
    </div>
  );
};
