"use client";

import { Badge } from "@/components/ui/badge";
import { useStaffMembership } from "@/hooks/use-staff";
import { useStaffPermissions } from "@/hooks/use-staff-permissions";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/hooks/use-translation";
import { useBusinessStore } from "@/lib/stores/business-store";
import { cn } from "@/lib/utils";

const STAFF_CATEGORY_LABEL_KEYS: Record<string, string> = {
  manager: "nav.accountRole.manager",
  accountant: "nav.accountRole.accountant",
  salesperson: "nav.accountRole.salesperson",
};

export const resolveAccountRoleLabel = (
  isOwner: boolean,
  category: { slug?: string; name?: string | null } | null | undefined,
  t: (key: string) => string,
): string | null => {
  if (isOwner) return t("nav.accountRole.owner");
  const slug = category?.slug?.trim().toLowerCase();
  if (slug && STAFF_CATEGORY_LABEL_KEYS[slug]) return t(STAFF_CATEGORY_LABEL_KEYS[slug]);
  return category?.name?.trim() || null;
};

type AccountRoleBadgeProps = {
  className?: string;
};

export const AccountRoleBadge = ({ className }: AccountRoleBadgeProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const permissions = useStaffPermissions();
  const currentBusinessId = useBusinessStore((state) => state.currentBusinessId);
  const { data: membership } = useStaffMembership(user?.id, currentBusinessId);

  if (!user) return null;

  const label = resolveAccountRoleLabel(
    permissions.isOwner,
    membership?.staff_categories,
    t,
  );

  if (!label) return null;

  return (
    <Badge
      variant={permissions.isOwner ? "secondary" : "outline"}
      className={cn("text-[11px] font-medium", className)}
    >
      {label}
    </Badge>
  );
};
