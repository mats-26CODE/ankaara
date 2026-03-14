/**
 * Types for subscription plans and features.
 * After applying migrations, regenerate DB types: supabase gen types typescript --local
 * and use Database["public"]["Tables"]["subscription_plans"] etc. for Supabase queries.
 */

export type SubscriptionPlanSlug = "free" | "pro" | "business";

export type SubscriptionPlanFeatureKey = "invoices_per_month" | "businesses_count";

export type SubscriptionPlanFeatureLimitType = "number" | "unlimited";

export interface SubscriptionPlanRow {
  id: string;
  slug: SubscriptionPlanSlug;
  name: string;
  description: string | null;
  price_amount: number | null;
  price_currency: string;
  billing_interval: "monthly" | "yearly" | null;
  is_contact_sales: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanFeatureRow {
  id: string;
  subscription_plan_id: string;
  feature_key: SubscriptionPlanFeatureKey;
  limit_type: SubscriptionPlanFeatureLimitType;
  limit_value: number | null;
  created_at: string;
}

/** Plan with features joined (for pricing page and enforcement). */
export interface SubscriptionPlanWithFeatures extends SubscriptionPlanRow {
  features: SubscriptionPlanFeatureRow[];
}

/** Resolved limit for a feature: number or null for unlimited. */
export const getFeatureLimit = (
  feature: SubscriptionPlanFeatureRow
): number | null => {
  if (feature.limit_type === "unlimited") return null;
  return feature.limit_value ?? null;
};
