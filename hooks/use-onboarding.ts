"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ToastAlert } from "@/config/toast";

type CompleteOnboardingPayload = {
  userId: string;
  currency: string;
  businessName: string;
  location?: string;
  capacity?: string;
  taxNumber?: string;
  fullName?: string;
  phone?: string;
};

type SkipOnboardingPayload = {
  userId: string;
  currency: string;
  fullName?: string;
};

/**
 * Upsert the business row — insert if none exists, update if one does.
 */
const upsertBusiness = async (
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  fields: { name: string; address?: string | null; capacity?: string | null; tax_number?: string | null; currency: string }
) => {
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", ownerId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("businesses")
      .update(fields)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("businesses")
      .insert({ owner_id: ownerId, ...fields });
    if (error) throw error;
  }
};

export const useCompleteOnboarding = () => {
  return useMutation({
    mutationFn: async (payload: CompleteOnboardingPayload) => {
      const supabase = createClient();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          preferred_currency: payload.currency,
          onboarding_completed: true,
          ...(payload.fullName ? { full_name: payload.fullName } : {}),
          ...(payload.phone ? { phone: payload.phone } : {}),
        })
        .eq("id", payload.userId);

      if (profileError) throw profileError;

      await upsertBusiness(supabase, payload.userId, {
        name: payload.businessName,
        address: payload.location?.trim() || null,
        capacity: payload.capacity?.trim() || null,
        tax_number: payload.taxNumber?.trim() || null,
        currency: payload.currency,
      });
    },
    onSuccess: () => {
      ToastAlert.success("Profile setup complete!");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Something went wrong. Please try again.");
    },
  });
};

export const useSkipOnboarding = () => {
  return useMutation({
    mutationFn: async (payload: SkipOnboardingPayload) => {
      const supabase = createClient();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          preferred_currency: payload.currency,
          onboarding_completed: true,
        })
        .eq("id", payload.userId);

      if (profileError) throw profileError;

      await upsertBusiness(supabase, payload.userId, {
        name: payload.fullName || "My Business",
        currency: payload.currency,
      });
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Something went wrong. Please try again.");
    },
  });
};
