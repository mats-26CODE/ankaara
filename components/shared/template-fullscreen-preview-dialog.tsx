"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TemplateFullscreenPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Screen reader only — no visible title bar */
  title: string;
  children: ReactNode;
  /** Optional class on the inner document wrapper (e.g. subtle border) */
  innerClassName?: string;
};

/**
 * Full-viewport template preview (invoice / quotation): dark backdrop, floating close,
 * document-sized width with horizontal scroll when needed — similar to zooming a photo.
 */
export const TemplateFullscreenPreviewDialog = ({
  open,
  onOpenChange,
  title,
  children,
  innerClassName,
}: TemplateFullscreenPreviewDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      overlayClassName="bg-zinc-950/94 backdrop-blur-none"
      closeButtonClassName={cn(
        "z-[60] mr-4 rounded-full border-0 bg-primary p-2.5 text-primary-foreground opacity-100 shadow-none ring-0",
        "hover:bg-primary/90 hover:text-primary-foreground hover:opacity-100",
        "focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:outline-none",
        "data-[state=open]:bg-primary data-[state=open]:text-primary-foreground",
        "top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]",
        "[&_svg]:size-5",
      )}
      className={cn(
        "flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-transparent p-0 shadow-none outline-none",
        "fixed inset-0 left-0 top-0 z-50 sm:max-w-none",
        "duration-200",
      )}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain">
          <div className="flex min-h-full items-start justify-center px-3 pb-10 pt-[max(4.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-14 sm:pt-[max(5rem,env(safe-area-inset-top))]">
            <div className={cn("w-max bg-white", innerClassName)}>{children}</div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
