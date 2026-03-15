"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionPlanSlug } from "@/hooks/use-subscription-plans";

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
  const slug = data?.plan as SubscriptionPlanSlug | undefined;
  const valid = slug && ["free", "pro", "business"].includes(slug);
  return valid ? { planSlug: slug as SubscriptionPlanSlug } : { planSlug: "free" };
};

export const useCurrentSubscription = (userId: string | undefined) => {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, userId ?? "anon"],
    queryFn: () => fetchCurrentSubscription(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};
