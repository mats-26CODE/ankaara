"use client";

import { APP_URL } from "@/constants/values";

export type ProductCatalogRow = {
  name: string;
  description: string;
  sellingPriceLabel: string;
};

export type ProductCatalogBranding = {
  businessName: string;
  logoUrl: string | null;
  logoText: string | null;
  brandColor?: string | null;
};

type Rgb = [number, number, number];

const DEFAULT_BRAND_HEX = "#2563eb";
const MARGIN_X = 14;
const FOOTER_RESERVE_MM = 20;
const FONT_FAMILY = "Figtree";

const slugifyFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/^_+|_+$/g, "") || "product_catalog";

export const getProductCatalogFilename = (businessName: string) =>
  `${slugifyFilename(businessName)}_product_catalog`;

const asCellText = (value: unknown): string => {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  return String(value).trim() || "—";
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
};

const parseHexColor = (hex: string | null | undefined, fallback = DEFAULT_BRAND_HEX): Rgb => {
  const raw = (hex?.trim() || fallback).replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return parseHexColor(fallback, DEFAULT_BRAND_HEX);
  }
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
};

const mixWithWhite = ([r, g, b]: Rgb, ratio: number): Rgb => [
  Math.round(r + (255 - r) * ratio),
  Math.round(g + (255 - g) * ratio),
  Math.round(b + (255 - b) * ratio),
];

const contrastingTextColor = (rgb: Rgb): Rgb => {
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.58 ? [24, 24, 27] : [255, 255, 255];
};

const formatGeneratedTimestamp = () =>
  new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const appLinkLabel = APP_URL.replace(/^https?:\/\//, "");

let figtreeFontsCache: { regular: string; bold: string } | null = null;
let figtreeFontsPromise: Promise<{ regular: string; bold: string }> | null = null;

const loadFigtreeFonts = async (): Promise<{ regular: string; bold: string }> => {
  if (figtreeFontsCache) return figtreeFontsCache;
  if (!figtreeFontsPromise) {
    figtreeFontsPromise = (async () => {
      const [regular, bold] = await Promise.all([
        fetch("/fonts/figtree/Figtree-Regular.ttf").then((res) => {
          if (!res.ok) throw new Error("Figtree Regular font failed to load");
          return res.arrayBuffer();
        }),
        fetch("/fonts/figtree/Figtree-Bold.ttf").then((res) => {
          if (!res.ok) throw new Error("Figtree Bold font failed to load");
          return res.arrayBuffer();
        }),
      ]);
      figtreeFontsCache = {
        regular: arrayBufferToBase64(regular),
        bold: arrayBufferToBase64(bold),
      };
      return figtreeFontsCache;
    })();
  }
  return figtreeFontsPromise;
};

const registerFigtreeFonts = async (doc: import("jspdf").jsPDF) => {
  const fonts = await loadFigtreeFonts();
  const fontList = doc.getFontList() as Record<string, unknown>;
  if (fontList[FONT_FAMILY]) return;

  doc.addFileToVFS("Figtree-Regular.ttf", fonts.regular);
  doc.addFont("Figtree-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFileToVFS("Figtree-Bold.ttf", fonts.bold);
  doc.addFont("Figtree-Bold.ttf", FONT_FAMILY, "bold");
};

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const loadPdfModules = async () => {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable =
    typeof autoTableModule.autoTable === "function"
      ? autoTableModule.autoTable
      : autoTableModule.default;

  if (typeof autoTable !== "function") {
    throw new Error("PDF export plugin failed to load. Refresh the page and try again.");
  }

  return { jsPDF: jspdfModule.jsPDF, autoTable };
};

const loadXlsxModule = async () => {
  const xlsxModule = await import("xlsx");
  return xlsxModule.default ?? xlsxModule;
};

const loadLogoDataUrl = async (
  logoUrl: string,
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" } | null> => {
  try {
    const proxyUrl = `${window.location.origin}/api/image-proxy?url=${encodeURIComponent(logoUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read logo"));
      reader.readAsDataURL(blob);
    });
    const format: "PNG" | "JPEG" =
      blob.type.includes("png") || dataUrl.includes("image/png") ? "PNG" : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
};

const getBrandingTitle = (branding: ProductCatalogBranding) =>
  branding.logoText?.trim() || branding.businessName;

const drawBrandStripe = (doc: import("jspdf").jsPDF, brandRgb: Rgb) => {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, pageW, 5.5, "F");
};

const drawPdfHeader = async (
  doc: import("jspdf").jsPDF,
  branding: ProductCatalogBranding,
  productCount: number,
  brandRgb: Rgb,
): Promise<number> => {
  const pageW = doc.internal.pageSize.getWidth();
  drawBrandStripe(doc, brandRgb);

  const headerTop = 12;
  let contentBottom = headerTop;

  const textStartX = MARGIN_X;
  let titleX = textStartX;

  if (branding.logoUrl) {
    try {
      const logo = await loadLogoDataUrl(branding.logoUrl);
      if (logo) {
        const logoW = 40;
        const logoH = 13;
        doc.addImage(
          logo.dataUrl,
          logo.format,
          textStartX,
          headerTop,
          logoW,
          logoH,
          undefined,
          "FAST",
        );
        titleX = textStartX + logoW + 5;
        contentBottom = Math.max(contentBottom, headerTop + logoH);
      }
    } catch {
      // fall through to text-only header
    }
  }

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.setTextColor(22, 22, 26);
  doc.text(getBrandingTitle(branding), titleX, headerTop + 5);
  contentBottom = Math.max(contentBottom, headerTop + 5);

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brandRgb);
  doc.text("Product & Price Catalog", titleX, headerTop + 10.5);
  contentBottom = Math.max(contentBottom, headerTop + 10.5);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 118);
  doc.text(
    `${productCount} product${productCount === 1 ? "" : "s"}`,
    pageW - MARGIN_X,
    headerTop + 4,
    {
      align: "right",
    },
  );
  doc.text(formatGeneratedTimestamp(), pageW - MARGIN_X, headerTop + 9.5, {
    align: "right",
  });
  contentBottom = Math.max(contentBottom, headerTop + 9.5);

  const dividerY = contentBottom + 3;
  const dividerRgb = mixWithWhite(brandRgb, 0.72);
  doc.setDrawColor(...dividerRgb);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, dividerY, pageW - MARGIN_X, dividerY);

  return dividerY + 2.5;
};

const drawPdfFooter = (
  doc: import("jspdf").jsPDF,
  branding: ProductCatalogBranding,
  brandRgb: Rgb,
  generatedAt: string,
  pageNumber: number,
  pageCount: number,
) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const footerY = pageH - 9;
  const dividerRgb = mixWithWhite(brandRgb, 0.78);

  doc.setDrawColor(...dividerRgb);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, footerY - 5.5, pageW - MARGIN_X, footerY - 5.5);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(95, 95, 102);
  doc.text(`Generated ${generatedAt} · ${asCellText(branding.businessName)}`, MARGIN_X, footerY);

  if (pageCount > 1) {
    doc.text(`Page ${pageNumber} of ${pageCount}`, pageW / 2, footerY, { align: "center" });
  }

  doc.setTextColor(...brandRgb);
  const linkWidth = doc.getTextWidth(appLinkLabel);
  doc.textWithLink(appLinkLabel, pageW - MARGIN_X - linkWidth, footerY, { url: APP_URL });
};

export const buildProductCatalogPdfBlob = async (
  branding: ProductCatalogBranding,
  rows: ProductCatalogRow[],
): Promise<Blob> => {
  const { jsPDF, autoTable } = await loadPdfModules();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await registerFigtreeFonts(doc);

  const brandRgb = parseHexColor(branding.brandColor);
  const headTextRgb = contrastingTextColor(brandRgb);
  const rowTintRgb = mixWithWhite(brandRgb, 0.93);
  const borderRgb = mixWithWhite(brandRgb, 0.82);
  const generatedAt = formatGeneratedTimestamp();

  const startY = await drawPdfHeader(doc, branding, rows.length, brandRgb);

  autoTable(doc, {
    startY,
    head: [["Product Name", "Description", "Selling Price"]],
    body: rows.map((row) => [
      asCellText(row.name),
      asCellText(row.description),
      asCellText(row.sellingPriceLabel),
    ]),
    styles: {
      font: FONT_FAMILY,
      fontSize: 9,
      cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
      textColor: [38, 38, 42],
      lineColor: borderRgb,
      lineWidth: 0.15,
    },
    headStyles: {
      font: FONT_FAMILY,
      fontStyle: "bold",
      fontSize: 9,
      fillColor: brandRgb,
      textColor: headTextRgb,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
    },
    alternateRowStyles: {
      fillColor: rowTintRgb,
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 36, halign: "right", fontStyle: "bold" },
    },
    margin: { top: 0, left: MARGIN_X, right: MARGIN_X, bottom: FOOTER_RESERVE_MM },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPdfFooter(doc, branding, brandRgb, generatedAt, page, pageCount);
  }

  const output = doc.output("arraybuffer");
  return new Blob([output], { type: "application/pdf" });
};

export const downloadProductCatalogPdf = async (
  branding: ProductCatalogBranding,
  rows: ProductCatalogRow[],
) => {
  const blob = await buildProductCatalogPdfBlob(branding, rows);
  triggerBrowserDownload(blob, `${getProductCatalogFilename(branding.businessName)}.pdf`);
};

export const downloadProductCatalogExcel = async (
  branding: ProductCatalogBranding,
  rows: ProductCatalogRow[],
) => {
  const XLSX = await loadXlsxModule();
  const title = getBrandingTitle(branding);
  const generatedAt = formatGeneratedTimestamp();

  const sheetRows: (string | number)[][] = [
    [title],
    ["Product & Price Catalog"],
    [`${rows.length} products`],
    [`Generated ${generatedAt}`],
    [],
    ["Product Name", "Description", "Selling Price"],
    ...rows.map((row) => [
      asCellText(row.name),
      asCellText(row.description),
      asCellText(row.sellingPriceLabel),
    ]),
    [],
    [`${asCellText(branding.businessName)} · Generated ${generatedAt}`, "", appLinkLabel],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  worksheet["!cols"] = [{ wch: 30 }, { wch: 50 }, { wch: 18 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, `${getProductCatalogFilename(branding.businessName)}.xlsx`);
};

export const shareProductCatalogFile = async (
  file: File,
  title: string,
  text: string,
): Promise<boolean> => {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const payload: ShareData = { title, text };
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ ...payload, files: [file] });
    } else {
      await navigator.share({ ...payload, url: window.location.href });
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
