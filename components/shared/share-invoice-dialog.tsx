"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastAlert } from "@/config/toast";
import { Copy, Check, Mail, Phone, ExternalLink, Share2, FileDown, FileImage } from "lucide-react";
import { jsPDF } from "jspdf";
import { captureElementAsCanvas, downloadAsPng, downloadAsPdf } from "@/lib/capture-invoice";
import { useTranslation } from "@/hooks/use-translation";

type ShareInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  clientName: string;
  total: string;
  currency: string;
  shareUrl: string;
  isDraft?: boolean;
  onSendIfDraft?: () => Promise<void>;
  /** ID of the invoice DOM element to capture as image (e.g. when sharing from dashboard detail) */
  invoiceElementId?: string;
};

type ShareChannel = {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (url: string, message: string, emailSubject?: string) => string;
};

const ShareInvoiceDialog = ({
  open,
  onOpenChange,
  invoiceNumber,
  clientName,
  total,
  currency,
  shareUrl,
  isDraft,
  onSendIfDraft,
  invoiceElementId,
}: ShareInvoiceDialogProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);
  const [sending, setSending] = useState(false);

  const ensureSentBeforeShare = async () => {
    if (!isDraft || !onSendIfDraft) return;
    setSending(true);
    try {
      await onSendIfDraft();
    } finally {
      setSending(false);
    }
  };

  const message = t("dashboard.invoices.share.message", {
    clientName,
    invoiceNumber,
    currency,
    total,
    shareUrl,
  });
  const emailSubject = t("dashboard.invoices.share.emailSubject", { invoiceNumber });

  const channels: ShareChannel[] = useMemo(
    () => [
      {
        id: "whatsapp",
        labelKey: "dashboard.invoices.share.channelWhatsapp",
        icon: (
          <svg viewBox="0 0 24 24" className="size-5 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        ),
        color: "bg-[#25D366] hover:bg-[#1da851] text-white",
        getUrl: (_url, msg) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
      },
      {
        id: "email",
        labelKey: "dashboard.invoices.share.channelEmail",
        icon: <Mail className="size-5" />,
        color: "bg-blue-600 hover:bg-blue-700 text-white",
        getUrl: (_url, msg, subject = "") =>
          `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`,
      },
      {
        id: "sms",
        labelKey: "dashboard.invoices.share.channelSms",
        icon: <Phone className="size-5" />,
        color: "bg-emerald-600 hover:bg-emerald-700 text-white",
        getUrl: (_url, msg) => `sms:?body=${encodeURIComponent(msg)}`,
      },
    ],
    [],
  );

  const handleCopy = async () => {
    try {
      await ensureSentBeforeShare();
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      ToastAlert.success(t("dashboard.invoices.share.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ToastAlert.error(t("dashboard.invoices.share.markSentFailed"));
    }
  };

  const handleShare = async (channel: ShareChannel) => {
    try {
      await ensureSentBeforeShare();
      const url = channel.getUrl(shareUrl, message, emailSubject);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      ToastAlert.error(t("dashboard.invoices.share.markSentFailed"));
    }
  };

  const captureInvoiceCanvas = async () => {
    if (!invoiceElementId || typeof document === "undefined") return null;
    const el = document.getElementById(invoiceElementId);
    if (!el) return null;
    return captureElementAsCanvas(el);
  };

  const handleExportImage = async () => {
    setExporting("image");
    try {
      await ensureSentBeforeShare();
      const canvas = await captureInvoiceCanvas();
      if (!canvas) {
        ToastAlert.error(t("dashboard.invoices.share.captureFailed"));
        return;
      }
      downloadAsPng(canvas, invoiceNumber);
    } catch {
      ToastAlert.error(t("dashboard.invoices.share.exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      await ensureSentBeforeShare();
      const canvas = await captureInvoiceCanvas();
      if (!canvas) {
        ToastAlert.error(t("dashboard.invoices.share.captureFailed"));
        return;
      }
      downloadAsPdf(canvas, invoiceNumber, jsPDF);
    } catch {
      ToastAlert.error(t("dashboard.invoices.share.exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await ensureSentBeforeShare();
      await navigator.share({
        title: t("dashboard.invoices.share.nativeShareTitle", { invoiceNumber }),
        text: message,
        url: shareUrl,
      });
    } catch {
      // user cancelled or send failed
    }
  };

  const handleOpenPublicPage = async () => {
    try {
      await ensureSentBeforeShare();
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } catch {
      ToastAlert.error(t("dashboard.invoices.share.markSentFailed"));
    }
  };

  const isBusy = sending || !!exporting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dashboard.invoices.share.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dashboard.invoices.share.dialogDescription", { number: invoiceNumber, clientName })}
            {isDraft ? ` ${t("dashboard.invoices.share.draftWillBeSent")}` : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {invoiceElementId && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-w-0 flex-1"
                onClick={handleExportImage}
                disabled={isBusy}
              >
                <FileImage className="mr-2 size-4 shrink-0" />
                {exporting === "image"
                  ? t("dashboard.invoices.share.downloading")
                  : t("dashboard.invoices.share.downloadPng")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-0 flex-1"
                onClick={handleExportPdf}
                disabled={isBusy}
              >
                <FileDown className="mr-2 size-4 shrink-0" />
                {exporting === "pdf"
                  ? t("dashboard.invoices.share.downloading")
                  : t("dashboard.invoices.share.downloadPdf")}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("dashboard.invoices.share.linkLabel")}</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="bg-muted text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy} disabled={isBusy}>
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("dashboard.invoices.share.viaLabel")}</p>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => void handleShare(channel)}
                  disabled={isBusy}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${channel.color}`}
                >
                  {channel.icon}
                  <span className="truncate">{t(channel.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button variant="outline" className="w-full" onClick={handleNativeShare} disabled={isBusy}>
              <Share2 className="mr-2 size-4" />
              {t("dashboard.invoices.share.moreOptions")}
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={handleOpenPublicPage} disabled={isBusy}>
            <ExternalLink className="mr-2 size-4" />
            {t("dashboard.invoices.share.openPublicPage")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ShareInvoiceDialog };
