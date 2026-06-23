"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionPlanSlug } from "@/hooks/use-subscription-plans";
import { VALID_PLAN_SLUGS } from "@/hooks/use-subscription-plans";

const SUBSCRIPTION_QUERY_KEY = ["subscriptions"] as const;

export type CurrentSubscription = {
  planSlug: SubscriptionPlanSlug;
  endDate: string | null;
};

const normalizePlanSlug = (slug: string | undefined): SubscriptionPlanSlug => {
  const valid = slug && VALID_PLAN_SLUGS.includes(slug);
  if (!valid) return "free";
  if (slug === "pro") return "pro-monthly";
  if (slug === "business") return "business-monthly";
  return slug as SubscriptionPlanSlug;
};

const fetchCurrentSubscription = async (
  userId: string | undefined,
): Promise<CurrentSubscription | null> => {
  if (!userId) return null;

  const supabase = createClient();
  await supabase.rpc("check_subscription_expiry", { p_user_id: userId });

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, end_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return { planSlug: normalizePlanSlug(data?.plan as string | undefined), endDate: data?.end_date ?? null };
};

export const fetchEffectiveSubscription = async (
  businessId: string | null | undefined,
): Promise<CurrentSubscription | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_effective_subscription", {
    p_business_id: businessId ?? undefined,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as
    | { plan_slug?: string | null; end_date?: string | null }
    | null
    | undefined;

  return {
    planSlug: normalizePlanSlug(row?.plan_slug ?? undefined),
    endDate: row?.end_date ?? null,
  };
};

const EFFECTIVE_SUBSCRIPTION_QUERY_KEY = ["effective-subscription"] as const;

export const useEffectiveSubscriptionQuery = (businessId: string | null | undefined) =>
  useQuery({
    queryKey: [...EFFECTIVE_SUBSCRIPTION_QUERY_KEY, businessId ?? "none"],
    queryFn: () => fetchEffectiveSubscription(businessId),
    staleTime: 2 * 60 * 1000,
  });

export const useCurrentSubscription = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, userId ?? "anon"],
    queryFn: () => fetchCurrentSubscription(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};
