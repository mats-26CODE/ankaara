"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastAlert } from "@/config/toast";
import type { Business } from "@/hooks/use-businesses";
import type { Product } from "@/hooks/use-products";
import { fetchProductsForCatalogExport } from "@/lib/export/fetch-products-for-catalog-export";
import {
  buildProductCatalogPdfBlob,
  downloadProductCatalogExcel,
  downloadProductCatalogPdf,
  getProductCatalogFilename,
  shareProductCatalogFile,
  type ProductCatalogRow,
  type ProductCatalogColumnLabels,
} from "@/lib/export/product-catalog-export";
import { FileDown, FileSpreadsheet, Mail, Share2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

type ShareProductCatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business | null;
  formatPrice: (amount: number) => string;
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ShareProductCatalogDialog = ({
  open,
  onOpenChange,
  business,
  formatPrice,
}: ShareProductCatalogDialogProps) => {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<"pdf" | "excel" | "share-pdf" | null>(null);

  const businessName = business?.name?.trim() || "Business";

  const shareMessage = t("productCatalog.share.message", { businessName });
  const emailSubject = t("productCatalog.share.emailSubject", { businessName });
  const nativeShareTitle = t("productCatalog.share.nativeShareTitle", { businessName });
  const nativeShareText = t("productCatalog.share.nativeShareText", { businessName });

  const columnLabels: ProductCatalogColumnLabels = {
    productName: t("productCatalog.columns.productName"),
    description: t("productCatalog.columns.description"),
    sellingPricePerItem: t("productCatalog.columns.sellingPricePerItem"),
  };

  const buildRows = (products: Product[]): ProductCatalogRow[] =>
    products.map((product) => {
      const price = Number(product.selling_price ?? product.unit_price ?? 0);
      const safeName =
        typeof product.name === "string" ? product.name.trim() || "—" : "—";
      const safeDescription =
        typeof product.description === "string"
          ? product.description.trim() || "—"
          : "—";
      return {
        name: safeName,
        description: safeDescription,
        sellingPriceLabel: formatPrice(Number.isFinite(price) ? price : 0),
      };
    });

  const loadCatalogData = async () => {
    if (!business?.id) {
      ToastAlert.error("Select a business first.");
      return null;
    }
    const products = await fetchProductsForCatalogExport(business.id);
    if (products.length === 0) {
      ToastAlert.error("No products to export. Add items to your inventory first.");
      return null;
    }
    const branding = {
      businessName,
      logoUrl: business.logo_url,
      logoText: business.logo_text,
      brandColor: business.brand_color,
    };
    return { branding, rows: buildRows(products), columnLabels };
  };

  const handleDownloadPdf = async () => {
    setExporting("pdf");
    try {
      const data = await loadCatalogData();
      if (!data) return;
      await downloadProductCatalogPdf(data.branding, data.rows, data.columnLabels);
      ToastAlert.success("Product catalog PDF downloaded");
    } catch (err) {
      console.error("Product catalog PDF export failed:", err);
      ToastAlert.error(
        err instanceof Error && err.message
          ? err.message
          : "Could not export PDF. Try again.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadExcel = async () => {
    setExporting("excel");
    try {
      const data = await loadCatalogData();
      if (!data) return;
      await downloadProductCatalogExcel(data.branding, data.rows, data.columnLabels);
      ToastAlert.success("Product catalog Excel file downloaded");
    } catch (err) {
      console.error("Product catalog Excel export failed:", err);
      ToastAlert.error(
        err instanceof Error && err.message
          ? err.message
          : "Could not export Excel. Try again.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handleSharePdf = async () => {
    setExporting("share-pdf");
    try {
      const data = await loadCatalogData();
      if (!data) return;
      const blob = await buildProductCatalogPdfBlob(
        data.branding,
        data.rows,
        data.columnLabels,
      );
      const filename = `${getProductCatalogFilename(businessName)}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      const shared = await shareProductCatalogFile(
        file,
        nativeShareTitle,
        nativeShareText,
      );
      if (shared) {
        ToastAlert.success("Catalog shared");
      } else {
        ToastAlert.error("Sharing is not supported on this device. Download the PDF instead.");
      }
    } catch {
      ToastAlert.error("Could not share catalog. Try downloading instead.");
    } finally {
      setExporting(null);
    }
  };

  const handleShareMessage = (channel: "whatsapp" | "email") => {
    const url =
      channel === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
        : `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Product Catalog</DialogTitle>
          <DialogDescription>
            Export or share your full inventory for{" "}
            <span className="font-medium">{businessName}</span>. Documents include your business
            logo when uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-w-0 flex-1"
              onClick={handleDownloadPdf}
              disabled={!!exporting}
            >
              <FileDown className="mr-2 size-4 shrink-0" />
              {exporting === "pdf" ? "Exporting..." : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-0 flex-1"
              onClick={handleDownloadExcel}
              disabled={!!exporting}
            >
              <FileSpreadsheet className="mr-2 size-4 shrink-0" />
              {exporting === "excel" ? "Exporting..." : "Download Excel"}
            </Button>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Share via</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleShareMessage("whatsapp")}
                className="flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1da851]"
              >
                <WhatsAppIcon />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => handleShareMessage("email")}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Mail className="size-5" />
                Email
              </button>
            </div>
            <p className="text-muted-foreground text-xs">
              Download PDF or Excel first, then attach it to your message.
            </p>
          </div>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSharePdf}
              disabled={!!exporting}
            >
              <Share2 className="mr-2 size-4" />
              {exporting === "share-pdf" ? "Preparing..." : "Share PDF file..."}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ShareProductCatalogDialog };
