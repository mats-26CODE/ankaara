import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/constants/values";

export const alt = "Invoice preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(
      "invoice_number, status, total, currency, client:clients(name), business:businesses(name)"
    )
    .eq("id", id)
    .single();

  if (error || !invoice || invoice.status === "draft") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700 }}>Invoice</div>
          <div style={{ fontSize: 24, opacity: 0.8, marginTop: 8 }}>{APP_NAME}</div>
        </div>
      ),
      { ...size }
    );
  }

  const clientName = (invoice.client as { name: string } | null)?.name ?? "Client";
  const businessName = (invoice.business as { name: string } | null)?.name ?? "Business";
  const total = Number(invoice.total).toLocaleString();
  const status = String(invoice.status);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "48px 56px 32px",
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
              {businessName}
            </div>
            <div style={{ fontSize: 18, color: "#64748b" }}>{APP_NAME}</div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
              {invoice.invoice_number}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: status === "paid" ? "#10b981" : "#3b82f6",
                color: "white",
                textTransform: "uppercase",
              }}
            >
              {status}
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 56px",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 18, color: "#64748b", fontWeight: 600 }}>
              Bill To
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
              {clientName}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24, color: "#64748b" }}>Amount Due</span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {invoice.currency} {total}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 56px",
            borderTop: "1px solid #e2e8f0",
            fontSize: 16,
            color: "#94a3b8",
          }}
        >
          View and pay this invoice at the link
        </div>
      </div>
    ),
    { ...size }
  );
}
