"use client";

import { useEffect, useMemo } from "react";

import { useProfile, isStaffAccount } from "@/hooks/use-profile";
import {
  activatePendingStaffMembership,
  getMembershipPermissions,
  useStaffMembership,
} from "@/hooks/use-staff";
import { useBusinessStore } from "@/lib/stores/business-store";
import { resolveStaffPermissions, canManageSales, type ResolvedStaffPermissions } from "@/lib/staff-permissions";
import { useUser } from "@/hooks/use-user";

export const useStaffPermissions = (): ResolvedStaffPermissions => {
  const { user } = useUser();
  const { profile } = useProfile();
  const currentBusinessId = useBusinessStore((s) => s.currentBusinessId);
  const { data: membership } = useStaffMembership(user?.id, currentBusinessId);

  useEffect(() => {
    if (!user?.id) return;
    void activatePendingStaffMembership();
  }, [user?.id]);

  return useMemo(() => {
    const isStaffOnBusiness =
      !!membership &&
      membership.business_id === currentBusinessId &&
      ["pending", "active"].includes(membership.status);

    const isOwner = !isStaffOnBusiness;
    const document = isOwner ? null : getMembershipPermissions(membership);
    return resolveStaffPermissions(isOwner, document);
  }, [currentBusinessId, membership]);
};

export const useCanManageSales = (): boolean => {
  const permissions = useStaffPermissions();
  const { user } = useUser();
  const currentBusinessId = useBusinessStore((s) => s.currentBusinessId);
  const { data: membership } = useStaffMembership(user?.id, currentBusinessId);

  return useMemo(
    () => canManageSales(permissions, membership?.staff_categories?.slug),
    [membership?.staff_categories?.slug, permissions],
  );
};

export const useIsStaffUser = (): boolean => {
  const { user } = useUser();
  const { profile } = useProfile();
  const currentBusinessId = useBusinessStore((s) => s.currentBusinessId);
  const { data: membership } = useStaffMembership(user?.id, currentBusinessId);

  return (
    isStaffAccount(profile, user) ||
    (!!membership &&
      membership.business_id === currentBusinessId &&
      ["pending", "active"].includes(membership.status))
  );
};
