"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileImage } from "lucide-react";
import { jsPDF } from "jspdf";
import { ToastAlert } from "@/config/toast";
import { captureElementAsCanvas, downloadAsPng, downloadAsPdf } from "@/lib/capture-invoice";
import { useTranslation } from "@/hooks/use-translation";

export const QUOTATION_ELEMENT_ID = "quotation-to-export";

export const QuotationExportButtons = ({ quotationNumber }: { quotationNumber: string }) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  const captureCanvas = async () => {
    if (typeof document === "undefined") return null;
    const el = document.getElementById(QUOTATION_ELEMENT_ID);
    if (!el) {
      ToastAlert.error(t("dashboard.quotations.share.notFoundRefresh"));
      return null;
    }
    try {
      return await captureElementAsCanvas(el);
    } catch {
      ToastAlert.error(t("dashboard.quotations.share.captureFailed"));
      return null;
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    const canvas = await captureCanvas();
    if (canvas) downloadAsPdf(canvas, quotationNumber, jsPDF);
    setExporting(null);
  };

  const handleExportImage = async () => {
    setExporting("image");
    const canvas = await captureCanvas();
    if (canvas) downloadAsPng(canvas, quotationNumber);
    setExporting(null);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportImage} disabled={!!exporting}>
        <FileImage className="mr-2 size-4" />
        {exporting === "image"
          ? t("dashboard.quotations.share.exporting")
          : t("dashboard.quotations.share.exportImage")}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!!exporting}>
        <FileDown className="mr-2 size-4" />
        {exporting === "pdf"
          ? t("dashboard.quotations.share.exporting")
          : t("dashboard.quotations.share.exportPdf")}
      </Button>
    </div>
  );
};
