import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";
import type { jsPDF } from "jspdf";

const getProxyUrl = (url: string): string => {
  if (typeof window === "undefined") return url;
  return `${window.location.origin}/api/image-proxy?url=${encodeURIComponent(url)}`;
};

const IMAGE_LOAD_TIMEOUT_MS = 8000;

const waitForImages = (element: HTMLElement): Promise<void> => {
  const imgs = element.querySelectorAll<HTMLImageElement>("img[src^='http']");
  return Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => {
            clearTimeout(t);
            resolve();
          };
          img.onload = done;
          img.onerror = done;
          const t = setTimeout(done, IMAGE_LOAD_TIMEOUT_MS);
        })
    )
  ).then(() => {});
};

/**
 * Capture the element as canvas. Temporarily replaces external image URLs
 * with same-origin proxy URLs so html2canvas can draw them, then restores.
 */
export const captureElementAsCanvas = async (
  element: HTMLElement
): Promise<HTMLCanvasElement | null> => {
  const externalImgs = element.querySelectorAll<HTMLImageElement>(
    "img[src^='http://'], img[src^='https://']"
  );
  const restores: { img: HTMLImageElement; src: string }[] = [];

  for (const img of Array.from(externalImgs)) {
    const src = img.getAttribute("src") || img.src;
    if (!src) continue;
    restores.push({ img, src });
    img.src = getProxyUrl(src);
  }

  try {
    await waitForImages(element);
    // Prefer html-to-image (better maintained); fallback to html2canvas
    try {
      const canvas = await htmlToImage.toCanvas(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      return canvas;
    } catch {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      return canvas;
    }
  } catch (_err) {
    return null;
  } finally {
    for (const { img, src } of restores) {
      img.src = src;
    }
  }
};

export const downloadAsPng = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement("a");
  link.download = `${filename.replace(/[^a-zA-Z0-9-_]/g, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadAsPdf = (
  canvas: HTMLCanvasElement,
  filename: string,
  jsPDFLib: typeof jsPDF
) => {
  const pdf = new jsPDFLib("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = Math.min(pageW / imgW, pageH / imgH) * 0.95;
  const w = imgW * ratio;
  const h = imgH * ratio;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, w, h);
  pdf.save(`${filename.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`);
};
