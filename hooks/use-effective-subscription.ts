"use client";

import { useMemo } from "react";

import { useBusinesses } from "@/hooks/use-businesses";
import { useEffectiveSubscriptionQuery } from "@/hooks/use-current-subscription";
import { useProfile, isStaffAccount } from "@/hooks/use-profile";
import { useStaffMembership } from "@/hooks/use-staff";
import { useUser } from "@/hooks/use-user";
import { useCurrentBusinessId } from "@/lib/stores/business-store";
import {
  isStaffBillingContext,
  isStaffInheritedPlan,
} from "@/lib/subscription-billing";

export const useEffectiveSubscription = () => {
  const { user } = useUser();
  const { profile } = useProfile();
  const { currentBusinessId } = useCurrentBusinessId();
  const { businesses, loading: businessesLoading } = useBusinesses();
  const { data: membership, isLoading: membershipLoading } = useStaffMembership(
    user?.id,
    currentBusinessId,
  );

  const activeBusiness = useMemo(
    () => businesses.find((business) => business.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId],
  );

  const hasStaffMembership =
    !!membership &&
    membership.business_id === currentBusinessId &&
    ["pending", "active"].includes(membership.status);

  const subscriptionQuery = useEffectiveSubscriptionQuery(currentBusinessId);
  const billingUserId = activeBusiness?.owner_id ?? user?.id;

  const planInheritedFromBusiness = isStaffInheritedPlan(
    user?.id,
    profile?.account_type,
    isStaffBillingContext(user?.id, profile?.account_type, activeBusiness, hasStaffMembership)
      ? activeBusiness?.owner_id
      : user?.id,
    hasStaffMembership || isStaffAccount(profile, user),
  );

  const isPlanAccessLoading =
    businessesLoading ||
    membershipLoading ||
    subscriptionQuery.isLoading ||
    subscriptionQuery.isPending;

  return {
    ...subscriptionQuery,
    billingUserId,
    planInheritedFromBusiness,
    activeBusiness,
    hasStaffMembership,
    isPlanAccessLoading,
  };
};
