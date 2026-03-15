"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type SubscriptionPlanFeature = Tables<"subscription_plan_features">;

export type SubscriptionPlanWithFeatures = SubscriptionPlan & {
  features: SubscriptionPlanFeature[];
};

/** Plan slug for type-safe routing and CTAs. Includes Pro and Business intervals. */
export type SubscriptionPlanSlug =
  | "free"
  | "pro-monthly"
  | "pro-6month"
  | "pro-yearly"
  | "business"
  | "business-monthly"
  | "business-6month"
  | "business-yearly";

/** Logical tier for grouping (Free, Pro, Business). */
export type PlanTier = "free" | "pro" | "business";

/** All valid plan slugs (including legacy 'pro' for existing subscriptions). */
export const VALID_PLAN_SLUGS: readonly string[] = [
  "free",
  "pro",
  "pro-monthly",
  "pro-6month",
  "pro-yearly",
  "business",
  "business-monthly",
  "business-6month",
  "business-yearly",
];

/** Derive plan tier from slug for grouping and "is Pro" checks. */
export const getPlanTier = (slug: string | null | undefined): PlanTier => {
  if (!slug) return "free";
  if (slug === "free") return "free";
  if (slug === "business" || slug?.startsWith("business-")) return "business";
  if (slug === "pro" || slug.startsWith("pro-")) return "pro";
  return "free";
};

const INTERVAL_ORDER = ["monthly", "6_month", "yearly"] as const;

/** Group plans by plan_tier for display (single card per tier with tabs for intervals). */
export const groupPlansByTier = (
  plans: SubscriptionPlanWithFeatures[],
): {
  free: SubscriptionPlanWithFeatures | null;
  pro: SubscriptionPlanWithFeatures[];
  business: SubscriptionPlanWithFeatures[];
} => {
  const free = plans.find((p) => p.slug === "free") ?? null;
  const pro = plans
    .filter((p) => getPlanTier(p.slug) === "pro")
    .sort(
      (a, b) =>
        INTERVAL_ORDER.indexOf(
          (a.billing_interval ?? "monthly") as (typeof INTERVAL_ORDER)[number],
        ) -
        INTERVAL_ORDER.indexOf(
          (b.billing_interval ?? "monthly") as (typeof INTERVAL_ORDER)[number],
        ),
    );
  const business = plans
    .filter((p) => getPlanTier(p.slug) === "business")
    .sort(
      (a, b) =>
        INTERVAL_ORDER.indexOf(
          (a.billing_interval ?? "monthly") as (typeof INTERVAL_ORDER)[number],
        ) -
        INTERVAL_ORDER.indexOf(
          (b.billing_interval ?? "monthly") as (typeof INTERVAL_ORDER)[number],
        ),
    );
  return { free, pro, business };
};

const FEATURE_LABELS: Record<string, { singular: string; plural: string; unlimited: string }> = {
  invoices_per_month: {
    singular: "invoice per month",
    plural: "invoices per month",
    unlimited: "Unlimited invoices",
  },
  businesses_count: {
    singular: "business",
    plural: "businesses",
    unlimited: "Unlimited businesses",
  },
  clients_per_business: {
    singular: "client",
    plural: "clients",
    unlimited: "Unlimited clients",
  },
  products_per_business: {
    singular: "product or service",
    plural: "products or services",
    unlimited: "Unlimited products",
  },
};

/** Human-readable feature description for display. */
export const formatPlanFeature = (feature: SubscriptionPlanFeature): string => {
  const labels = FEATURE_LABELS[feature.feature_key];
  if (!labels) return feature.feature_key;
  if (feature.limit_type === "unlimited") return labels.unlimited;
  const n = feature.limit_value ?? 0;
  return n === 1 ? `1 ${labels.singular}` : `${n} ${labels.plural}`;
};

const SUBSCRIPTION_PLANS_QUERY_KEY = ["subscription-plans"] as const;

const fetchSubscriptionPlansWithFeatures = async (): Promise<SubscriptionPlanWithFeatures[]> => {
  const supabase = createClient();

  const { data: plans, error: plansError } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (plansError) throw plansError;
  if (!plans?.length) return [];

  const { data: features, error: featuresError } = await supabase
    .from("subscription_plan_features")
    .select("*")
    .in(
      "subscription_plan_id",
      plans.map((p) => p.id),
    );

  if (featuresError) throw featuresError;

  const featuresByPlanId = (features ?? []).reduce(
    (acc, f) => {
      if (!acc[f.subscription_plan_id]) acc[f.subscription_plan_id] = [];
      acc[f.subscription_plan_id].push(f);
      return acc;
    },
    {} as Record<string, SubscriptionPlanFeature[]>,
  );

  return plans.map((plan) => ({
    ...plan,
    features: featuresByPlanId[plan.id] ?? [],
  }));
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: SUBSCRIPTION_PLANS_QUERY_KEY,
    queryFn: fetchSubscriptionPlansWithFeatures,
    staleTime: 5 * 60 * 1000,
  });
};
