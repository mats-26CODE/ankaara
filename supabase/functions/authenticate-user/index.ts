// @ts-nocheck
// Deploy with verify_jwt disabled (see supabase/config.toml). Invoked from login/sign-up
// before the user has a session; uses service role inside for auth admin operations.
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

type PhonePayload = { phone_number: string };
type SendOtpCodesPayload = { phone_number: string };
type AuthFunctionOperation = "login" | "signup" | "resend" | "sendOtpCodes";
type AuthFunctionPayload = PhonePayload | SendOtpCodesPayload;

const ERROR_CODES = {
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_EXISTS: "ACCOUNT_EXISTS",
} as const;

const serviceClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const validatePhone = (phone_number: string) => {
  const phoneRegex = /^(\+?255|0)[67][0-9]{8}$/;
  if (!phoneRegex.test(phone_number)) {
    throw new Error("Invalid phone number, Please verify your phone number");
  }
};

/**
 * Beem Africa API returns { successful: true, message: "...", ... } at top level.
 * Do NOT use response.data.successful - there is no nested "data" property.
 */
const sendCodeSms = async (phone_number: string, code: string, _userId: string) => {
  const apiKey = Deno.env.get("BEEM_SMS_API_KEY")!;
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY")!;
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");

  const message = `Karibu Ankaara, Your OTP code is ${code}. It will expire in 5 minutes.`;
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

  if (!response.ok) {
    throw new Error(responseData?.message || `SMS API returned status ${response.status}`);
  }

  // Beem returns { successful: true } at top level, NOT in response.data
  if (responseData.successful === false) {
    throw new Error(responseData?.message || "Failed to send SMS. Please try again.");
  }

  return responseData;
};

const getUserIdByPhone = async (phone_number: string): Promise<string | null> => {
  const { data: existingUser, error: existingUserError } = await serviceClient.rpc(
    "get_user_by_phone",
    { phone_number },
  );
  if (existingUserError) throw existingUserError;
  const rows = existingUser ?? [];
  return rows.length > 0 ? rows[0].id : null;
};

/** Keep JWT app_metadata aligned with staff profile / membership (repairs invited existing users). */
const ensureAuthMetadataMatchesStaff = async (userId: string): Promise<void> => {
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const { count: staffMemberships, error: membershipError } = await serviceClient
    .from("business_staff")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["pending", "active"]);
  if (membershipError) throw membershipError;

  const shouldBeStaff = profile?.account_type === "staff" || (staffMemberships ?? 0) > 0;
  if (!shouldBeStaff) return;

  if (profile?.account_type !== "staff") {
    const { error: profileUpdateError } = await serviceClient
      .from("profiles")
      .update({ account_type: "staff", onboarding_completed: true })
      .eq("id", userId);
    if (profileUpdateError) throw profileUpdateError;
  }

  const { data: authUser, error: authUserError } = await serviceClient.auth.admin.getUserById(userId);
  if (authUserError) throw authUserError;
  if (!authUser.user) return;

  if (authUser.user.app_metadata?.account_type === "staff") return;

  const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...authUser.user.app_metadata,
      account_type: "staff",
      provider: authUser.user.app_metadata?.provider ?? "phone",
    },
  });
  if (updateError) throw updateError;
};

const sendOtpForUser = async (phone_number: string, userId: string) => {
  let code = "";

  if (TEST_ACCOUNTS.includes(phone_number)) {
    code = Deno.env.get("TEST_ACCOUNT_CODE") as string;
  } else {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const smsResponse = await sendCodeSms(phone_number, code, userId);
    if (smsResponse.successful === false) {
      throw new Error(smsResponse?.message || "Failed to send OTP SMS");
    }
  }

  const { error: otpError } = await serviceClient.rpc("set_confirmation", {
    phone_number,
    code,
  });
  if (otpError) throw otpError;
};

const login = async ({ phone_number }: PhonePayload) => {
  validatePhone(phone_number);

  const userId = await getUserIdByPhone(phone_number);
  if (!userId) {
    const err = new Error(
      "No account found for this phone number. Please sign up to create an account.",
    );
    (err as Error & { code: string }).code = ERROR_CODES.ACCOUNT_NOT_FOUND;
    throw err;
  }

  await ensureAuthMetadataMatchesStaff(userId);
  await sendOtpForUser(phone_number, userId);
};

const signup = async ({ phone_number }: PhonePayload) => {
  validatePhone(phone_number);

  const existingUserId = await getUserIdByPhone(phone_number);
  if (existingUserId) {
    const err = new Error(
      "An account already exists for this phone number. Please sign in instead.",
    );
    (err as Error & { code: string }).code = ERROR_CODES.ACCOUNT_EXISTS;
    throw err;
  }

  const { data: newUser, error: userCreateError } = await serviceClient.auth.admin.createUser({
    phone: phone_number,
    user_metadata: { user_type: "user", phone: phone_number },
    app_metadata: { account_type: "owner" },
  });
  if (userCreateError) throw userCreateError;

  await sendOtpForUser(phone_number, newUser.user.id);
};

const resend = async ({ phone_number }: PhonePayload) => {
  validatePhone(phone_number);

  let userId = "";

  const { data: existingUser, error: existingUserError } = await serviceClient.rpc(
    "get_user_by_phone",
    { phone_number },
  );

  if (existingUserError) throw existingUserError;

  if (existingUser.length === 0) {
    throw new Error("No user registered with this phone number");
  }
  userId = existingUser[0].id;

  await ensureAuthMetadataMatchesStaff(userId);
  await sendOtpForUser(phone_number, userId);
};

const sendOTPCodes = async ({ phone_number }: SendOtpCodesPayload) => {
  let code = "";

  if (TEST_ACCOUNTS.includes(phone_number)) {
    code = Deno.env.get("TEST_ACCOUNT_CODE") as string;
  } else {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const apiKey = Deno.env.get("BEEM_SMS_API_KEY")!;
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY")!;
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  const message = `Its Ankaara, Your OTP code is ${code}. It will expire in 5 minutes.`;
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
    throw new Error(responseData?.message || "Failed to send OTP SMS");
  }

  return { otpCodes: code };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const {
      operation,
      payload,
    }: { operation: AuthFunctionOperation; payload: AuthFunctionPayload } = await req.json();

    if (operation === "login") {
      await login(payload as PhonePayload);
    }

    if (operation === "signup") {
      await signup(payload as PhonePayload);
    }

    if (operation === "resend") {
      await resend(payload as PhonePayload);
    }

    if (operation === "sendOtpCodes") {
      const results = await sendOTPCodes(payload);
      return new Response(
        JSON.stringify({
          error: false,
          message: "ok",
          otpCodes: results.otpCodes,
        }),
        { status: 200, headers },
      );
    }

    return new Response(JSON.stringify({ error: false, message: "ok" }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      error instanceof Error && "code" in error
        ? (error as Error & { code?: string }).code
        : undefined;
    const status =
      code === ERROR_CODES.ACCOUNT_NOT_FOUND
        ? 404
        : code === ERROR_CODES.ACCOUNT_EXISTS
          ? 409
          : 500;
    return new Response(
      JSON.stringify({
        error: true,
        message,
        ...(code ? { code } : {}),
      }),
      { status, headers },
    );
  }
});
