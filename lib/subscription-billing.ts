import type { Tables } from "@/database.types";

type BillingBusiness = Pick<Tables<"businesses">, "owner_id"> | null | undefined;

export const isStaffBillingContext = (
  userId: string | undefined,
  accountType: Tables<"profiles">["account_type"] | undefined,
  activeBusiness: BillingBusiness,
  hasStaffMembership?: boolean,
): boolean => {
  if (!userId || !activeBusiness?.owner_id) return false;
  if (activeBusiness.owner_id === userId) return false;
  return accountType === "staff" || !!hasStaffMembership;
};

export const resolveBillingUserId = (
  userId: string | undefined,
  accountType: Tables<"profiles">["account_type"] | undefined,
  activeBusiness: BillingBusiness,
  hasStaffMembership?: boolean,
): string | undefined => {
  if (!userId) return undefined;
  if (isStaffBillingContext(userId, accountType, activeBusiness, hasStaffMembership)) {
    return activeBusiness?.owner_id;
  }
  return userId;
};

export const isStaffInheritedPlan = (
  userId: string | undefined,
  accountType: Tables<"profiles">["account_type"] | undefined,
  billingUserId: string | undefined,
  hasStaffMembership?: boolean,
): boolean =>
  !!billingUserId &&
  billingUserId !== userId &&
  (accountType === "staff" || !!hasStaffMembership);
