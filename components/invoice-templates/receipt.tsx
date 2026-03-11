import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";

export const ReceiptTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, currency, subtotal, tax, total, notes, footerNote, business, client, items, isPaid } = props;

  const renderLogo = () => {
    if (business?.logo_url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={business.logo_url} alt={business.name} className="h-10 w-auto mx-auto mb-2" />;
    }
    if (business?.logo_text) {
      return <p className="text-xl font-bold">{business.logo_text}</p>;
    }
    return <p className="text-xl font-bold">{business?.name}</p>;
  };

  return (
    <div className="bg-white text-gray-900 max-w-md mx-auto rounded-lg border border-dashed border-gray-300 overflow-hidden">
      {/* Header */}
      <div className="text-center px-6 pt-8 pb-4">
        {renderLogo()}
        {business?.address && <p className="text-xs text-gray-500 mt-1">{business.address}</p>}
        {business?.tax_number && <p className="text-xs text-gray-400">TIN: {business.tax_number}</p>}
      </div>

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Invoice info */}
      <div className="px-6 py-4 text-center">
        <p className="text-lg font-bold">{invoiceNumber}</p>
        <p className="text-xs text-gray-400 mt-1">
          {dayjs(issueDate).format("MMM D, YYYY")} — Due {dayjs(dueDate).format("MMM D, YYYY")}
        </p>
        <div className="mt-2">
          {isPaid ? (
            <span className="text-xs font-bold text-emerald-600">PAID</span>
          ) : status === "overdue" ? (
            <span className="text-xs font-bold text-red-600">OVERDUE</span>
          ) : (
            <span className="text-xs font-bold text-gray-500 uppercase">{status}</span>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="px-6 pb-3 text-center">
        <p className="text-xs text-gray-400">Billed to</p>
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
              <p className="text-xs text-gray-400">{Number(item.quantity)} × {Number(item.unit_price).toLocaleString()}</p>
            </div>
            <p className="font-medium ml-4 shrink-0">{Number(item.total).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 mx-4" />

      {/* Totals */}
      <div className="px-6 py-4 space-y-1">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
        {Number(tax) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{Number(tax).toLocaleString()}</span></div>}
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

      {/* Footer Note */}
      <div className="px-6 pb-6 pt-2 text-center">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest">
          {footerNote || "Thank you for your business"}
        </p>
      </div>
    </div>
  );
};
