// @ts-nocheck
// Owner or staff with staff_management.manage can invite staff.
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

const TEST_ACCOUNTS = ["255767645559"];

type InviteStaffPayload = {
  business_id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  staff_category_id: string;
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

const sendInviteNotificationSms = async (
  phone_number: string,
  businessName: string,
  inviterName: string | null,
) => {
  if (TEST_ACCOUNTS.includes(phone_number)) return;

  const apiKey = Deno.env.get("BEEM_SMS_API_KEY")!;
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY")!;
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  const inviterPart = inviterName
    ? `${inviterName} added you to ${businessName} on Ankaara.`
    : `You have been added to ${businessName} on Ankaara.`;
  const message = `Karibu Ankaara! ${inviterPart} Sign in with this phone number in the app to get started.`;
  const authHeader = "Basic " + btoa(`${apiKey}:${secretKey}`);

  const response = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      source_addr: sourceAddress,
      schedule_time: "",
      encoding: 0,
      message,
      recipients: [{ recipient_id: 1, dest_addr: phone_number }],
    }),
  });

  const responseData = await response.json();
  if (!response.ok || responseData.successful === false) {
    throw new Error(responseData?.message || "Failed to send SMS. Please try again.");
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

const syncStaffAuthMetadata = async (
  userId: string,
  first_name: string,
  last_name: string,
  full_name: string,
): Promise<void> => {
  const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(userId);
  if (authUserError) throw authUserError;
  if (!authUser.user) return;

  const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...authUser.user.app_metadata,
      account_type: "staff",
      provider: authUser.user.app_metadata?.provider ?? "phone",
      first_name,
      last_name,
    },
    user_metadata: {
      ...(authUser.user.user_metadata ?? {}),
      full_name,
      first_name,
      last_name,
    },
  });
  if (updateError) throw updateError;
};

const upsertStaffProfileDetails = async (
  userId: string,
  details: {
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    email: string | null;
  },
): Promise<void> => {
  const { error } = await serviceClient.from("profiles").upsert(
    {
      id: userId,
      account_type: "staff",
      auth_type: "Phone",
      first_name: details.first_name,
      last_name: details.last_name,
      full_name: details.full_name,
      email: details.email,
      phone: details.phone,
      onboarding_completed: true,
      is_active: true,
      is_deleted: false,
      preferred_language: "sw",
    },
    { onConflict: "id" },
  );

  if (error) throw error;
};

const resolveDisplayName = (profile: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null): string | null => {
  if (!profile) return null;
  const fullName = profile.full_name?.trim();
  if (fullName) return fullName;
  const parts = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return parts || null;
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

    const payload = (await req.json()) as InviteStaffPayload;
    const phone_number = addCountryCode(payload.phone?.trim() ?? "");
    validatePhone(phone_number);

    const first_name = payload.first_name?.trim();
    const last_name = payload.last_name?.trim();
    if (!first_name || !last_name) {
      throw new Error("First name and last name are required");
    }
    if (!payload.business_id || !payload.staff_category_id) {
      throw new Error("Business and staff category are required");
    }

    const { data: business, error: businessError } = await serviceClient
      .from("businesses")
      .select("id, owner_id, name")
      .eq("id", payload.business_id)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) {
      return new Response(JSON.stringify({ error: true, message: "Business not found" }), {
        status: 404,
        headers,
      });
    }

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

    const { data: inviterProfile, error: inviterProfileError } = await serviceClient
      .from("profiles")
      .select("full_name, first_name, last_name")
      .eq("id", caller.id)
      .maybeSingle();
    if (inviterProfileError) throw inviterProfileError;

    const { data: billingUserId, error: billingUserError } = await serviceClient.rpc(
      "resolve_subscription_user_id",
      {
        p_user_id: caller.id,
        p_business_id: payload.business_id,
      },
    );
    if (billingUserError) throw billingUserError;

    const planUserId = billingUserId ?? business.owner_id;

    const { error: featureError } = await serviceClient.rpc("require_plan_feature", {
      p_user_id: planUserId,
      p_feature_key: "staff_management",
    });
    if (featureError) throw featureError;

    const { error: limitError } = await serviceClient.rpc("check_plan_limit", {
      p_user_id: planUserId,
      p_feature_key: "staff_count",
      p_context: { business_id: payload.business_id },
    });
    if (limitError) throw limitError;

    const { data: category, error: categoryError } = await serviceClient
      .from("staff_categories")
      .select("id, business_id, is_system")
      .eq("id", payload.staff_category_id)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) {
      throw new Error("Staff category not found");
    }
    if (category.business_id !== null && category.business_id !== payload.business_id) {
      throw new Error("Invalid staff category for this business");
    }

    let staffUserId = await getUserIdByPhone(phone_number);
    const full_name = `${first_name} ${last_name}`.trim();

    if (staffUserId) {
      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("id, account_type")
        .eq("id", staffUserId)
        .maybeSingle();
      if (profileError) throw profileError;

      if (profile?.account_type === "owner") {
        const { count: ownedBusinesses } = await serviceClient
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", staffUserId);
        if (ownedBusinesses && ownedBusinesses > 0) {
          throw new Error(
            "This phone number belongs to a business owner account and cannot be added as staff.",
          );
        }
      }

      const { count: otherActiveMemberships } = await serviceClient
        .from("business_staff")
        .select("id", { count: "exact", head: true })
        .eq("user_id", staffUserId)
        .in("status", ["pending", "active"])
        .neq("business_id", payload.business_id);
      if (otherActiveMemberships && otherActiveMemberships > 0) {
        throw new Error("This staff member is already linked to another business.");
      }
    } else {
      const { data: newUser, error: userCreateError } = await serviceClient.auth.admin.createUser({
        phone: phone_number,
        phone_confirm: false,
        app_metadata: {
          provider: "phone",
          account_type: "staff",
          first_name,
          last_name,
        },
        user_metadata: {
          phone: phone_number,
          full_name,
          first_name,
          last_name,
        },
      });
      if (userCreateError) throw userCreateError;
      staffUserId = newUser.user.id;
    }

    await upsertStaffProfileDetails(staffUserId, {
      first_name,
      last_name,
      full_name,
      phone: phone_number,
      email: payload.email?.trim() || null,
    });
    await syncStaffAuthMetadata(staffUserId, first_name, last_name, full_name);

    const { data: existingMembership } = await serviceClient
      .from("business_staff")
      .select("id, status")
      .eq("business_id", payload.business_id)
      .eq("user_id", staffUserId)
      .maybeSingle();

    if (existingMembership?.status === "active" || existingMembership?.status === "pending") {
      throw new Error("This person is already staff for this business.");
    }

    if (existingMembership) {
      const { error: reinviteError } = await serviceClient
        .from("business_staff")
        .update({
          staff_category_id: payload.staff_category_id,
          status: "pending",
          invited_by: caller.id,
          invited_at: new Date().toISOString(),
          joined_at: null,
          removed_at: null,
        })
        .eq("id", existingMembership.id);
      if (reinviteError) throw reinviteError;
    } else {
      const { error: insertError } = await serviceClient.from("business_staff").insert({
        business_id: payload.business_id,
        user_id: staffUserId,
        staff_category_id: payload.staff_category_id,
        status: "pending",
        invited_by: caller.id,
      });
      if (insertError) throw insertError;
    }

    const { error: repairError } = await serviceClient.rpc("repair_staff_account", {
      p_user_id: staffUserId,
    });
    if (repairError) throw repairError;

    const businessName = business.name?.trim() || "your business";
    const inviterName = resolveDisplayName(inviterProfile);
    await sendInviteNotificationSms(phone_number, businessName, inviterName);

    return new Response(
      JSON.stringify({
        error: false,
        message: "Staff invited successfully",
        user_id: staffUserId,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("PLAN_LIMIT") ? 402 : 500;
    return new Response(JSON.stringify({ error: true, message }), { status, headers });
  }
});
