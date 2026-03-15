"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionPlanSlug } from "@/hooks/use-subscription-plans";
import { VALID_PLAN_SLUGS } from "@/hooks/use-subscription-plans";

const SUBSCRIPTION_QUERY_KEY = ["subscriptions"] as const;

const fetchCurrentSubscription = async (
  userId: string | undefined,
): Promise<{ planSlug: SubscriptionPlanSlug } | null> => {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const slug = data?.plan as string | undefined;
  const valid = slug && VALID_PLAN_SLUGS.includes(slug);
  const normalizedSlug: SubscriptionPlanSlug = valid
    ? (slug === "pro"
        ? "pro-monthly"
        : slug === "business"
          ? "business-monthly"
          : (slug as SubscriptionPlanSlug))
    : "free";
  return { planSlug: normalizedSlug };
};

export const useCurrentSubscription = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, userId ?? "anon"],
    queryFn: () => fetchCurrentSubscription(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};
