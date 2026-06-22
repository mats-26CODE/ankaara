"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ToastAlert } from "@/config/toast";
import { addCountryCode } from "@/helpers/helpers";
import { toastMutationSuccess } from "@/lib/mutation-toast";
import { parseEdgeFunctionError } from "@/lib/supabase/edge-function-error";
import { parseStaffPermissions, type StaffPermissionsDocument } from "@/lib/staff-permissions";
import { buildOrIlikeClause, toIlikePattern } from "@/lib/supabase/table-search";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";

export type StaffCategory = Tables<"staff_categories">;
export type BusinessStaff = Tables<"business_staff">;

export type StaffMembership = BusinessStaff & {
  staff_categories: StaffCategory | null;
};

export const STAFF_MEMBERSHIP_QUERY_KEY = ["staff-membership"] as const;
export const STAFF_CATEGORIES_QUERY_KEY = ["staff-categories"] as const;
export const businessStaffQueryRoot = (businessId: string) =>
  ["business-staff", businessId] as const;
export const businessStaffQueryKey = (
  businessId: string,
  page: number,
  pageSize: number,
  search = "",
) => [...businessStaffQueryRoot(businessId), page, pageSize, search.trim()] as const;

/** @deprecated Use businessStaffQueryRoot for invalidation. */
export const BUSINESS_STAFF_QUERY_KEY = businessStaffQueryRoot;

export const activatePendingStaffMembership = async (): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase.rpc("activate_pending_staff_membership");
  if (error) throw error;
};

export const useStaffMembership = (userId: string | undefined, businessId?: string | null) =>
  useQuery({
    queryKey: [...STAFF_MEMBERSHIP_QUERY_KEY, userId ?? "anonymous", businessId ?? "any"],
    enabled: !!userId,
    queryFn: async (): Promise<StaffMembership | null> => {
      if (!userId) return null;
      const supabase = createClient();

      let query = supabase
        .from("business_staff")
        .select("*, staff_categories(*)")
        .eq("user_id", userId)
        .in("status", ["pending", "active"]);

      if (businessId) {
        query = query.eq("business_id", businessId);
      } else {
        query = query.order("invited_at", { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return (data as StaffMembership | null) ?? null;
    },
  });

export const useStaffCategories = (businessId: string | null) =>
  useQuery({
    queryKey: [...STAFF_CATEGORIES_QUERY_KEY, businessId ?? "none"],
    enabled: !!businessId,
    queryFn: async (): Promise<StaffCategory[]> => {
      if (!businessId) return [];
      const supabase = createClient();

      const { data, error } = await supabase
        .from("staff_categories")
        .select("*")
        .or(`business_id.is.null,business_id.eq.${businessId}`)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data as StaffCategory[]) ?? [];
    },
  });

export type BusinessStaffRow = BusinessStaff & {
  profile: Pick<
    Tables<"profiles">,
    "id" | "full_name" | "phone" | "email" | "first_name" | "last_name" | "avatar_url"
  > | null;
  staff_categories: StaffCategory | null;
};

export type BusinessStaffPage = {
  rows: BusinessStaffRow[];
  totalCount: number;
};

export const STAFF_PAGE_SIZE = 10;

const resolveStaffSearchUserIds = async (
  businessId: string,
  rawSearch: string,
): Promise<string[] | null> => {
  const term = rawSearch.trim();
  if (!term) return null;

  const supabase = createClient();
  const userIds = new Set<string>();

  const profileClause = buildOrIlikeClause(
    ["full_name", "first_name", "last_name", "email", "phone"],
    term,
  );
  if (profileClause) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .or(profileClause);
    if (profileError) throw profileError;
    for (const profile of profiles ?? []) {
      userIds.add(profile.id);
    }
  }

  const rolePattern = toIlikePattern(term);
  if (rolePattern) {
    const { data: categories, error: categoryError } = await supabase
      .from("staff_categories")
      .select("id")
      .or(`business_id.is.null,business_id.eq.${businessId}`)
      .ilike("name", rolePattern);
    if (categoryError) throw categoryError;

    const categoryIds = (categories ?? []).map((category) => category.id);
    if (categoryIds.length > 0) {
      const { data: staffByRole, error: staffByRoleError } = await supabase
        .from("business_staff")
        .select("user_id")
        .eq("business_id", businessId)
        .neq("status", "removed")
        .in("staff_category_id", categoryIds);
      if (staffByRoleError) throw staffByRoleError;
      for (const row of staffByRole ?? []) {
        userIds.add(row.user_id);
      }
    }
  }

  return [...userIds];
};

export const useBusinessStaff = (
  businessId: string | null,
  page = 1,
  pageSize = STAFF_PAGE_SIZE,
  search = "",
) =>
  useQuery({
    queryKey: businessStaffQueryKey(businessId ?? "none", page, pageSize, search),
    enabled: !!businessId,
    queryFn: async (): Promise<BusinessStaffPage> => {
      if (!businessId) return { rows: [], totalCount: 0 };
      const supabase = createClient();
      const matchingUserIds = await resolveStaffSearchUserIds(businessId, search);
      if (matchingUserIds !== null && matchingUserIds.length === 0) {
        return { rows: [], totalCount: 0 };
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("business_staff")
        .select(
          "*, profile:profiles!business_staff_user_id_fkey(id, full_name, phone, email, first_name, last_name, avatar_url), staff_categories(*)",
          { count: "exact" },
        )
        .eq("business_id", businessId)
        .neq("status", "removed")
        .order("invited_at", { ascending: false });

      if (matchingUserIds !== null) {
        query = query.in("user_id", matchingUserIds);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      return {
        rows: (data as BusinessStaffRow[]) ?? [],
        totalCount: count ?? 0,
      };
    },
  });

export type InviteStaffPayload = {
  business_id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string;
  staff_category_id: string;
};

export const useInviteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InviteStaffPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("invite-staff", {
        body: {
          ...payload,
          phone: addCountryCode(payload.phone),
        },
      });

      const errMessage = await parseEdgeFunctionError(error);
      if (errMessage) throw new Error(errMessage);

      const body = data as { error?: boolean; message?: string } | null;
      if (body?.error) throw new Error(body.message || "Failed to invite staff");

      return data;
    },
    onSuccess: (_data, variables, _onMutateResult, context) => {
      void queryClient.invalidateQueries({
        queryKey: businessStaffQueryRoot(variables.business_id),
      });
      toastMutationSuccess(
        context,
        "Staff invited. They will receive a text to sign in with their phone number.",
      );
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to invite staff");
    },
  });
};

export type UpdateStaffMemberPayload = {
  business_id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  staff_category_id?: string;
};

export const useUpdateStaffMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateStaffMemberPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("update-staff-member", {
        body: {
          ...payload,
          phone: addCountryCode(payload.phone),
        },
      });

      const errMessage = await parseEdgeFunctionError(error);
      if (errMessage) throw new Error(errMessage);

      const body = data as { error?: boolean; message?: string } | null;
      if (body?.error) throw new Error(body.message || "Failed to update staff member");

      return payload.business_id;
    },
    onSuccess: (businessId, _variables, _onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: businessStaffQueryRoot(businessId) });
      toastMutationSuccess(context, "Staff member updated");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update staff member");
    },
  });
};

export type UpdateBusinessStaffPayload = {
  id: string;
  business_id: string;
  staff_category_id?: string;
  status?: BusinessStaff["status"];
};

export const useUpdateBusinessStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, business_id, ...fields }: UpdateBusinessStaffPayload) => {
      const supabase = createClient();
      const updateFields: Partial<BusinessStaff> = {};
      if (fields.staff_category_id !== undefined) {
        updateFields.staff_category_id = fields.staff_category_id;
      }
      if (fields.status !== undefined) {
        updateFields.status = fields.status;
        if (fields.status === "removed") {
          updateFields.removed_at = new Date().toISOString();
        }
      }

      const { error } = await supabase.from("business_staff").update(updateFields).eq("id", id);
      if (error) throw error;
      return business_id;
    },
    onSuccess: (businessId, _variables, _onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: businessStaffQueryRoot(businessId) });
      toastMutationSuccess(context, "Staff updated");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to update staff");
    },
  });
};

export const getMembershipPermissions = (
  membership: StaffMembership | null | undefined,
): StaffPermissionsDocument =>
  parseStaffPermissions(membership?.staff_categories?.permissions ?? null);
