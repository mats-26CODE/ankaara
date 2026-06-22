import type { SupabaseClient } from "@supabase/supabase-js";

export const STAFF_SUSPENDED_MESSAGE =
  "Your staff account has been suspended or removed. Please contact your business administrator.";

export const STAFF_SUSPENDED_CODE = "STAFF_SUSPENDED";

export class StaffAccessDeniedError extends Error {
  code: string;

  constructor(message = STAFF_SUSPENDED_MESSAGE) {
    super(message);
    this.name = "StaffAccessDeniedError";
    this.code = STAFF_SUSPENDED_CODE;
  }
}

export const staffUserCanAuthenticate = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("staff_user_can_authenticate", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data === true;
};

export const enforceStaffSessionAllowed = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<void> => {
  const allowed = await staffUserCanAuthenticate(supabase, userId);
  if (!allowed) {
    await supabase.auth.signOut();
    throw new StaffAccessDeniedError();
  }
};
