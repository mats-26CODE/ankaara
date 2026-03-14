"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SubscriptionPlanSlug } from "@/hooks/use-subscription-plans";

type SetSubscriptionInput = {
  planSlug: SubscriptionPlanSlug;
  businessId: string;
};

const setSubscriptionForBusiness = async ({ planSlug, businessId }: SetSubscriptionInput) => {
  const supabase = createClient();

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", planSlug)
    .single();

  if (planError || !plan) throw new Error("Plan not found");

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("business_id", businessId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: planSlug,
        subscription_plan_id: plan.id,
        status: "active",
        end_date: null,
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return { subscriptionId: existing.id };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("subscriptions")
    .insert({
      business_id: businessId,
      plan: planSlug,
      subscription_plan_id: plan.id,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return { subscriptionId: inserted.id };
};

export const useSetSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setSubscriptionForBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};
