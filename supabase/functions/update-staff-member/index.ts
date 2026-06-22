// @ts-nocheck
// Update staff profile + membership. Owner or staff with staff_management.manage only.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

const headers = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

type UpdateStaffPayload = {
  business_id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  staff_category_id?: string;
};

const addCountryCode = (phoneNumber: string): string => {
  const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, "");
  if (cleanedNumber.startsWith("255")) return cleanedNumber;
  if (cleanedNumber.startsWith("0")) return "255" + cleanedNumber.slice(1);
  return "255" + cleanedNumber;
};

const validatePhone = (phone_number: string) => {
  const phoneRegex = /^(\+?255|0)[67][0-9]{8}$/;
  if (!phoneRegex.test(phone_number)) {
    throw new Error("Invalid phone number, Please verify your phone number");
  }
};

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const getUserIdByPhone = async (phone_number: string): Promise<string | null> => {
  const { data: existingUser, error } = await serviceClient.rpc("get_user_by_phone", {
    phone_number,
  });
  if (error) throw error;
  const rows = existingUser ?? [];
  return rows.length > 0 ? rows[0].id : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: true, message: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      },
    );

    const {
      data: { user: caller },
      error: userError,
    } = await userClient.auth.getUser(jwt);
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: true, message: "Unauthorized" }), {
        status: 401,
        headers,
      });
    }

    const payload = (await req.json()) as UpdateStaffPayload;
    const first_name = payload.first_name?.trim();
    const last_name = payload.last_name?.trim();
    if (!payload.business_id || !payload.staff_id || !first_name || !last_name || !payload.phone?.trim()) {
      throw new Error("Missing required fields");
    }

    const phone_number = addCountryCode(payload.phone.trim());
    validatePhone(phone_number);
    const full_name = `${first_name} ${last_name}`.trim();
    const email = payload.email?.trim() || null;

    const { data: business, error: businessError } = await serviceClient
      .from("businesses")
      .select("id, owner_id")
      .eq("id", payload.business_id)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) throw new Error("Business not found");

    const isOwner = business.owner_id === caller.id;
    if (!isOwner) {
      const { data: canManage, error: permError } = await userClient.rpc("staff_can", {
        p_business_id: payload.business_id,
        p_resource: "staff_management",
        p_action: "manage",
      });
      if (permError) throw permError;
      if (!canManage) {
        return new Response(JSON.stringify({ error: true, message: "Permission denied" }), {
          status: 403,
          headers,
        });
      }
    }

    const { data: membership, error: membershipError } = await serviceClient
      .from("business_staff")
      .select("id, user_id, status")
      .eq("id", payload.staff_id)
      .eq("business_id", payload.business_id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership || membership.status === "removed") {
      throw new Error("Staff member not found");
    }

    const staffUserId = membership.user_id;

    if (payload.staff_category_id) {
      const { data: category, error: categoryError } = await serviceClient
        .from("staff_categories")
        .select("id, business_id")
        .eq("id", payload.staff_category_id)
        .maybeSingle();
      if (categoryError) throw categoryError;
      if (!category) throw new Error("Staff category not found");
      if (category.business_id !== null && category.business_id !== payload.business_id) {
        throw new Error("Invalid staff category for this business");
      }
    }

    const existingPhoneUserId = await getUserIdByPhone(phone_number);
    if (existingPhoneUserId && existingPhoneUserId !== staffUserId) {
      throw new Error("This phone number is already registered to another account.");
    }

    const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(
      staffUserId,
    );
    if (authUserError) throw authUserError;

    const currentPhone = authUser.user.phone?.replace(/\D/g, "") ?? null;
    const nextPhone = phone_number.replace(/\D/g, "");
    if (currentPhone !== nextPhone) {
      const { error: phoneUpdateError } = await serviceClient.auth.admin.updateUserById(
        staffUserId,
        {
          phone: phone_number,
          phone_confirm: true,
          user_metadata: {
            ...(authUser.user.user_metadata ?? {}),
            phone: phone_number,
            full_name,
            first_name,
            last_name,
          },
          app_metadata: {
            ...(authUser.user.app_metadata ?? {}),
            account_type: "staff",
            first_name,
            last_name,
          },
        },
      );
      if (phoneUpdateError) throw phoneUpdateError;
    } else {
      const { error: metadataError } = await serviceClient.auth.admin.updateUserById(staffUserId, {
        user_metadata: {
          ...(authUser.user.user_metadata ?? {}),
          full_name,
          first_name,
          last_name,
        },
        app_metadata: {
          ...(authUser.user.app_metadata ?? {}),
          account_type: "staff",
          first_name,
          last_name,
        },
      });
      if (metadataError) throw metadataError;
    }

    const { error: profileError } = await serviceClient.from("profiles").upsert(
      {
        id: staffUserId,
        account_type: "staff",
        first_name,
        last_name,
        full_name,
        email,
        phone: phone_number,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    const staffUpdate: Record<string, unknown> = {};
    if (payload.staff_category_id) {
      staffUpdate.staff_category_id = payload.staff_category_id;
    }

    if (Object.keys(staffUpdate).length > 0) {
      const { error: staffRowError } = await serviceClient
        .from("business_staff")
        .update(staffUpdate)
        .eq("id", payload.staff_id);
      if (staffRowError) throw staffRowError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update staff member";
    return new Response(JSON.stringify({ error: true, message }), { status: 500, headers });
  }
});
