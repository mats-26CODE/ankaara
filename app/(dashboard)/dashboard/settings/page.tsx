"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useIsStaffUser, useStaffPermissions } from "@/hooks/use-staff-permissions";

const SettingsPage = () => {
  const router = useRouter();
  const isStaff = useIsStaffUser();
  const permissions = useStaffPermissions();

  useEffect(() => {
    if (isStaff) {
      if (permissions.can("business_settings", "view")) {
        router.replace("/dashboard/settings/businesses");
      } else {
        router.replace("/dashboard");
      }
      return;
    }
    router.replace("/dashboard/settings/profile");
  }, [isStaff, permissions, router]);

  return null;
};

export default SettingsPage;
