"use client";

import Link from "next/link";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/constants/values";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M17.564 12.78c.012 2.49 2.17 3.32 2.196 3.33-.018.064-.343 1.18-1.132 2.332-.682.996-1.39 1.99-2.506 2.01-1.096.02-1.448-.65-2.7-.65-1.252 0-1.644.63-2.68.67-1.078.04-1.898-1.078-2.586-2.07-1.404-2.03-2.476-5.738-1.036-8.24.715-1.244 1.994-2.03 3.382-2.05 1.058-.02 2.057.71 2.704.71.646 0 1.86-.878 3.136-.748.534.022 2.034.216 2.998 1.625-.078.048-1.79 1.044-1.776 3.12M15.535 5.27c.572-.692.957-1.656.852-2.616-.823.033-1.82.548-2.41 1.24-.53.612-.994 1.594-.868 2.534.92.07 1.854-.466 2.426-1.158" />
  </svg>
);

const GooglePlayLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className}>
    <path
      d="M3.6 2.1C3.32 2.4 3.16 2.86 3.16 3.46v17.08c0 .6.16 1.06.45 1.35l.06.05L13.2 12.1v-.2L3.66 2.05z"
      fill="#00D7FE"
    />
    <path
      d="M16.38 15.28 13.2 12.1v-.2l3.18-3.18.07.04 3.77 2.14c1.08.61 1.08 1.61 0 2.23l-3.77 2.14z"
      fill="#FFBC00"
    />
    <path d="m16.45 15.24-3.25-3.24-9.6 9.6c.36.38.94.42 1.6.05z" fill="#F9320B" />
    <path d="m3.6 2.1 9.6 9.6 3.25-3.24L5.2 2.05c-.66-.37-1.24-.33-1.6.05" fill="#00F076" />
  </svg>
);

type StoreButtonsProps = {
  className?: string;
};

const StoreButtons = ({ className }: StoreButtonsProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Link
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("landing.storeButtons.appStoreLabel")} ${t("landing.storeButtons.appStoreName")}`}
        className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-black py-[3px] pr-2.5 pl-0.5 text-white transition-transform duration-200 hover:scale-105 dark:border-white/15"
      >
        <AppleLogo className="size-8 shrink-0" />
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[9px] font-medium opacity-80">
            {t("landing.storeButtons.appStoreLabel")}
          </span>
          <span className="-mt-0.5 text-sm font-semibold">
            {t("landing.storeButtons.appStoreName")}
          </span>
        </span>
      </Link>

      <Link
        href={GOOGLE_PLAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("landing.storeButtons.googlePlayLabel")} ${t("landing.storeButtons.googlePlayName")}`}
        className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-black px-2.5 py-1 text-white transition-transform duration-200 hover:scale-105 dark:border-white/15"
      >
        <GooglePlayLogo className="size-6 shrink-0" />
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[9px] font-medium opacity-80">
            {t("landing.storeButtons.googlePlayLabel")}
          </span>
          <span className="-mt-0.5 text-sm font-semibold">
            {t("landing.storeButtons.googlePlayName")}
          </span>
        </span>
      </Link>
    </div>
  );
};

export { StoreButtons };
