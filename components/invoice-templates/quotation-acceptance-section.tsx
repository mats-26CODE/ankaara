/**
 * Reusable acceptance/signature block for quotation templates.
 * Shown when documentType is "quotation" to allow client sign-off.
 */
export const QuotationAcceptanceSection = () => (
  <div className="mt-6 border-t border-gray-200 pt-6">
    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
      Acceptance
    </p>
    <p className="mb-4 text-sm text-gray-600">
      By signing below, the client accepts this quotation and agrees to the terms and pricing
      outlined above.
    </p>
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      <div>
        <div className="mb-1 h-10 border-b border-gray-300" />
        <p className="text-xs text-gray-500">Signature</p>
      </div>
      <div>
        <div className="mb-1 h-10 border-b border-gray-300" />
        <p className="text-xs text-gray-500">Date</p>
      </div>
      <div>
        <div className="mb-1 h-10 border-b border-gray-300" />
        <p className="text-xs text-gray-500">Printed Name</p>
      </div>
    </div>
  </div>
);
