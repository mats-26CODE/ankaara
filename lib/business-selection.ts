import type { Tables } from "@/database.types";

type BusinessRow = Pick<Tables<"businesses">, "id" | "is_primary" | "owner_id">;

type StaffLinkRow = {
  business_id: string;
  invited_at?: string | null;
};

export const resolveDefaultBusinessId = (
  businesses: BusinessRow[],
  ownedBusinesses: BusinessRow[],
  staffLinks: StaffLinkRow[],
  currentBusinessId: string | null,
): string | null => {
  if (businesses.length === 0) return null;

  const accessibleIds = new Set(businesses.map((business) => business.id));
  if (currentBusinessId && accessibleIds.has(currentBusinessId)) {
    return currentBusinessId;
  }

  if (ownedBusinesses.length === 0 && staffLinks.length > 0) {
    const sortedLinks = [...staffLinks].sort((a, b) => {
      const aTime = a.invited_at ? Date.parse(a.invited_at) : 0;
      const bTime = b.invited_at ? Date.parse(b.invited_at) : 0;
      return bTime - aTime;
    });
    return sortedLinks[0]?.business_id ?? businesses[0].id;
  }

  const primaryBusiness = businesses.find((business) => business.is_primary);
  return primaryBusiness?.id ?? businesses[0].id;
};
