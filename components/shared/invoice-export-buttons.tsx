"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileImage } from "lucide-react";
import { jsPDF } from "jspdf";
import { ToastAlert } from "@/config/toast";
import {
  captureElementAsCanvas,
  downloadAsPng,
  downloadAsPdf,
} from "@/lib/capture-invoice";

const INVOICE_ELEMENT_ID = "invoice-to-export";

export const InvoiceExportButtons = ({
  invoiceNumber,
}: {
  invoiceNumber: string;
}) => {
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  const captureCanvas = async () => {
    if (typeof document === "undefined") return null;
    const el = document.getElementById(INVOICE_ELEMENT_ID);
    if (!el) {
      ToastAlert.error("Invoice not found. Please refresh the page.");
      return null;
    }
    try {
      return await captureElementAsCanvas(el);
    } catch {
      ToastAlert.error("Could not capture invoice. Try again.");
      return null;
    }
  };

  const handleExportImage = async () => {
    setExporting("image");
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      downloadAsPng(canvas, invoiceNumber);
    } catch {
      ToastAlert.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      downloadAsPdf(canvas, invoiceNumber, jsPDF);
    } catch {
      ToastAlert.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportImage}
        disabled={!!exporting}
      >
        <FileImage className="size-4 mr-2" />
        {exporting === "image" ? "Exporting..." : "Export as Image"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={!!exporting}
      >
        <FileDown className="size-4 mr-2" />
        {exporting === "pdf" ? "Exporting..." : "Export as PDF"}
      </Button>
    </div>
  );
};

export { INVOICE_ELEMENT_ID };
