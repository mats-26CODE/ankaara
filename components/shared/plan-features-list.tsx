"use client";

import { Check } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import {
  formatPlanFeature,
  sortPlanFeatures,
  type PlanTier,
  type SubscriptionPlanFeature,
} from "@/hooks/use-subscription-plans";

const FALLBACK_FEATURE_COUNT = 6;

type PlanFeaturesListProps = {
  features: SubscriptionPlanFeature[];
  tier: PlanTier;
  className?: string;
};

const PlanFeaturesList = ({ features, tier, className }: PlanFeaturesListProps) => {
  const { t } = useTranslation();
  const sorted = sortPlanFeatures(features);

  if (sorted.length > 0) {
    return (
      <ul className={className ?? "flex-1 space-y-3"}>
        {sorted.map((f) => (
          <li key={f.id} className="text-muted-foreground flex items-start gap-2 text-sm">
            <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <span>{formatPlanFeature(f)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={className ?? "flex-1 space-y-3"}>
      {Array.from({ length: FALLBACK_FEATURE_COUNT }, (_, i) => (
        <li key={i} className="text-muted-foreground flex items-start gap-2 text-sm">
          <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span>{t(`landing.pricing.${tier}.features.${i}`)}</span>
        </li>
      ))}
    </ul>
  );
};

export { PlanFeaturesList };
