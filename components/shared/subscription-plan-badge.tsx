"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getPlanTier, type PlanTier } from "@/hooks/use-subscription-plans";
import { Crown, Sparkles, Star, Zap } from "lucide-react";

type SubscriptionPlanBadgeProps = {
  planSlug: string;
  planName?: string | null;
  className?: string;
};

const FLOATING_STARS = [
  { className: "left-[8%] top-[15%] size-2.5 animate-plan-star-a opacity-70" },
  { className: "right-[12%] top-[20%] size-2 animate-plan-star-b opacity-60" },
  { className: "left-[22%] bottom-[18%] size-1.5 animate-plan-star-c opacity-50" },
  { className: "right-[20%] bottom-[22%] size-2.5 animate-plan-star-b opacity-65" },
  { className: "left-[48%] top-[8%] size-1.5 animate-plan-star-c opacity-55" },
] as const;

const BusinessVipBadge = ({ label, className }: { label: string; className?: string }) => (
  <span
    className={cn(
      "relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full border border-amber-300/80 px-4 py-1.5 text-sm font-semibold tracking-wide",
      "bg-linear-to-r from-amber-200 via-yellow-100 to-amber-300 text-amber-950",
      "shadow-[0_0_20px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.7)]",
      "dark:border-amber-400/50 dark:from-amber-500 dark:via-yellow-400 dark:to-amber-600 dark:text-amber-950",
      className,
    )}
    aria-label={`${label} subscription`}
  >
    {FLOATING_STARS.map((star, i) => (
      <Star
        key={i}
        className={cn(
          "pointer-events-none absolute fill-amber-400/90 text-amber-500",
          star.className,
        )}
        aria-hidden
      />
    ))}
    <span className="relative z-10 flex items-center gap-1.5">
      <Crown className="size-4 shrink-0 text-amber-800 dark:text-amber-950" strokeWidth={2.25} />
      <span className="capitalize">{label}</span>
      <Sparkles className="size-3.5 shrink-0 text-amber-700/90 dark:text-amber-900" aria-hidden />
    </span>
  </span>
);

const ProBadge = ({ label, className }: { label: string; className?: string }) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-400/40 px-4 py-1.5 text-sm font-semibold text-white capitalize",
      "via-primary bg-linear-to-r from-violet-600 to-violet-700",
      "shadow-[0_4px_14px_rgba(124,58,237,0.35)]",
      "dark:via-primary dark:border-violet-300/30 dark:from-violet-700 dark:to-violet-800",
      className,
    )}
    aria-label={`${label} subscription`}
  >
    <Zap className="size-4 shrink-0 fill-yellow-300/90 text-yellow-200" strokeWidth={2.25} />
    <span>{label}</span>
  </span>
);

const FreePlanBadge = ({ label, className }: { label: string; className?: string }) => (
  <Badge
    variant="outline"
    className={cn(
      "text-muted-foreground border-border bg-background/80 px-4 py-1.5 text-sm font-medium capitalize",
      className,
    )}
  >
    {label}
  </Badge>
);

const SubscriptionPlanBadge = ({ planSlug, planName, className }: SubscriptionPlanBadgeProps) => {
  const tier: PlanTier = getPlanTier(planSlug);
  const label = planName?.trim() || planSlug.replace(/-/g, " ");

  if (tier === "business") {
    return <BusinessVipBadge label={label} className={className} />;
  }

  if (tier === "pro") {
    return <ProBadge label={label} className={className} />;
  }

  return <FreePlanBadge label={label} className={className} />;
};

export { SubscriptionPlanBadge };
