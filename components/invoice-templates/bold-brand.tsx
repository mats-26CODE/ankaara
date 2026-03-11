import type { InvoiceTemplateProps } from "@/lib/invoice-templates/types";
import dayjs from "dayjs";

const DEFAULT_BRAND = "#2563eb";

export const BoldBrandTemplate = (props: InvoiceTemplateProps) => {
  const { invoiceNumber, status, issueDate, dueDate, currency, subtotal, tax, total, notes, accentColor, footerNote, business, client, items, isPaid } = props;
  const brand = accentColor || business?.brand_color || DEFAULT_BRAND;

  const renderLogo = () => {
    if (business?.logo_url) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={business.logo_url} alt={business.name} className="h-10 w-auto mb-3 brightness-0 invert" />;
    }
    if (business?.logo_text) {
      return <p className="text-2xl font-bold">{business.logo_text}</p>;
    }
    return <p className="text-2xl font-bold">{business?.name}</p>;
  };

  return (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-sm">
      {/* Colored header */}
      <div className="px-8 py-8 text-white" style={{ backgroundColor: brand }}>
        <div className="flex justify-between items-start">
          <div>
            {renderLogo()}
            {business?.address && <p className="text-sm opacity-80 mt-1">{business.address}</p>}
            {business?.tax_number && <p className="text-xs opacity-60">TIN: {business.tax_number}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium uppercase tracking-wider opacity-70">Invoice</p>
            <p className="text-3xl font-black mt-1">{invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: brand + "20" }}>
        <div className="flex gap-6">
          <div><p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: brand }}>Issue Date</p><p className="text-sm">{dayjs(issueDate).format("MMM D, YYYY")}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: brand }}>Due Date</p><p className="text-sm">{dayjs(dueDate).format("MMM D, YYYY")}</p></div>
        </div>
        {isPaid ? (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#059669" }}>PAID</span>
        ) : status === "overdue" ? (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-red-600">OVERDUE</span>
        ) : (
          <span className="px-4 py-1.5 rounded-full text-xs font-bold border-2 uppercase" style={{ borderColor: brand, color: brand }}>{status}</span>
        )}
      </div>

      {/* Bill to */}
      <div className="px-8 py-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brand }}>Bill To</p>
        <p className="text-lg font-bold">{client?.name}</p>
        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
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
              <th className="py-3 px-3 text-left text-xs font-bold uppercase tracking-wider rounded-l-lg" style={{ color: brand }}>Description</th>
              <th className="py-3 text-right text-xs font-bold uppercase tracking-wider w-16" style={{ color: brand }}>Qty</th>
              <th className="py-3 text-right text-xs font-bold uppercase tracking-wider w-28" style={{ color: brand }}>Price</th>
              <th className="py-3 px-3 text-right text-xs font-bold uppercase tracking-wider w-28 rounded-r-lg" style={{ color: brand }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-gray-50/50"}>
                <td className="py-3 px-3">{item.description}</td>
                <td className="py-3 text-right text-gray-600">{Number(item.quantity)}</td>
                <td className="py-3 text-right text-gray-600">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-bold">{Number(item.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-8 py-8 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{Number(subtotal).toLocaleString()}</span></div>
          {Number(tax) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{Number(tax).toLocaleString()}</span></div>}
          <div className="rounded-lg px-4 py-3 mt-2 flex justify-between items-baseline text-white" style={{ backgroundColor: brand }}>
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-black">{currency} {Number(total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-8 pb-8">
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brand }}>Notes</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Footer Note */}
      {footerNote && (
        <div className="px-8 pb-6 text-center">
          <p className="text-xs whitespace-pre-wrap" style={{ color: brand + "99" }}>{footerNote}</p>
        </div>
      )}
    </div>
  );
};
