// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OTP_EXPIRY_MINUTES = 10;

/** Same test numbers as authenticate-user; use TEST_ACCOUNT_CODE env instead of SMS. */
const TEST_ACCOUNTS = ["255767645559"];

type SendOtpPayload = { phone: string };
type VerifyAndUpdatePayload = {
  phone: string;
  code: string;
  profile?: {
    full_name?: string;
    avatar_url?: string | null;
    preferred_currency?: string;
    preferred_language?: "en" | "sw";
  };
};

type Operation = "sendOtp" | "verifyAndUpdate";

const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: corsHeaders });

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const isTestAccount = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return TEST_ACCOUNTS.includes(digits) || TEST_ACCOUNTS.includes(phone.trim());
};

const resolveOtpCode = (phone: string): { code: string; skipSms: boolean } => {
  if (isTestAccount(phone)) {
    const testCode = Deno.env.get("TEST_ACCOUNT_CODE");
    if (!testCode) {
      throw new Error("TEST_ACCOUNT_CODE is not configured");
    }
    return { code: testCode, skipSms: true };
  }
  return { code: generateOtp(), skipSms: false };
};

const sendSms = async (phone: string, code: string): Promise<void> => {
  const apiKey = Deno.env.get("BEEM_SMS_API_KEY");
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY");
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  if (!apiKey || !secretKey) {
    throw new Error("SMS provider is not configured");
  }
  const message = `Your Ankaara verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
  const smsAuth = "Basic " + btoa(`${apiKey}:${secretKey}`);
  const response = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: smsAuth },
    body: JSON.stringify({
      source_addr: sourceAddress,
      schedule_time: "",
      encoding: 0,
      message,
      recipients: [{ recipient_id: 1, dest_addr: phone }],
    }),
  });
  const data = await response.json();
  if (!response.ok || data.successful === false) {
    throw new Error(data?.message || `SMS failed: ${response.status}`);
  }
};

const getAuthenticatedUser = async (req: Request) => {
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();
  if (error || !user?.id) return null;
  return user;
};

const sendOtp = async (userId: string, { phone }: SendOtpPayload) => {
  const phoneTrimmed = phone.trim();
  if (!phoneTrimmed) {
    throw new Error("phone is required (e.g. 2557XXXXXXXX)");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: existingByPhone, error: lookupErr } = await supabase.rpc("get_user_by_phone", {
    phone_number: phoneTrimmed,
  });
  if (lookupErr) throw new Error("Unable to verify phone availability");

  const rows = (existingByPhone ?? []) as { id: string }[];
  if (rows.length > 0 && rows[0].id !== userId) {
    throw new Error(
      "This phone number is already registered to another account. Please use a different number.",
    );
  }

  const { code, skipSms } = resolveOtpCode(phoneTrimmed);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  if (!skipSms) {
    await sendSms(phoneTrimmed, code);
  }

  const { error: insertError } = await supabase.from("otp_verification").insert({
    user_id: userId,
    phone: phoneTrimmed,
    code,
    expires_at: expiresAt,
  });
  if (insertError) throw new Error("Failed to store OTP");
};

const verifyAndUpdate = async (
  userId: string,
  accessToken: string,
  { phone, code, profile }: VerifyAndUpdatePayload,
) => {
  const phoneTrimmed = phone.trim();
  const codeTrimmed = code.trim();
  if (!phoneTrimmed || !codeTrimmed) {
    throw new Error("phone and code are required");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: existingByPhone, error: lookupErr } = await supabase.rpc("get_user_by_phone", {
    phone_number: phoneTrimmed,
  });
  if (lookupErr) throw new Error("Unable to verify phone availability");

  const rows = (existingByPhone ?? []) as { id: string }[];
  if (rows.length > 0 && rows[0].id !== userId) {
    throw new Error(
      "This phone number is already registered to another account. Please use a different number.",
    );
  }

  const now = new Date().toISOString();
  const { data: row, error: selectError } = await supabase
    .from("otp_verification")
    .select("id")
    .eq("user_id", userId)
    .eq("phone", phoneTrimmed)
    .eq("code", codeTrimmed)
    .is("used_at", null)
    .gt("expires_at", now)
    .limit(1)
    .single();

  if (selectError || !row) {
    throw new Error("Invalid, expired or already used OTP");
  }

  const { error: markUsedError } = await supabase
    .from("otp_verification")
    .update({ used_at: now })
    .eq("id", row.id);
  if (markUsedError) throw new Error("Verification failed");

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    phone: phoneTrimmed,
    user_metadata: {
      phone: phoneTrimmed,
    },
  });
  if (authUpdateError) {
    console.error("[update-user-phone] auth update error:", authUpdateError);
    throw new Error(authUpdateError.message || "Failed to update login phone");
  }

  const profileFields: Record<string, unknown> = { phone: phoneTrimmed };
  if (profile) {
    if (profile.full_name !== undefined) {
      profileFields.full_name = profile.full_name || null;
    }
    if (profile.avatar_url !== undefined) {
      profileFields.avatar_url = profile.avatar_url;
    }
    if (profile.preferred_currency !== undefined) {
      profileFields.preferred_currency = profile.preferred_currency;
    }
    if (profile.preferred_language !== undefined) {
      profileFields.preferred_language = profile.preferred_language;
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileFields)
    .eq("id", userId);

  if (profileError) {
    console.error("[update-user-phone] profile update error:", profileError);
    const isDuplicate =
      profileError.code === "23505" || profileError.message?.includes("user_phone_number_key");
    throw new Error(
      isDuplicate
        ? "This phone number is already registered to another account. Please use a different number."
        : profileError.message || "Failed to update profile",
    );
  }

  const { error: signOutError } = await supabase.auth.admin.signOut(accessToken, "global");
  if (signOutError) {
    console.error("[update-user-phone] signOut error:", signOutError);
    throw new Error("Phone updated but failed to end session. Please sign out manually.");
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return json({ success: false, message: "Unauthorized" }, 401);
    }

    let body: { operation?: Operation; payload?: SendOtpPayload | VerifyAndUpdatePayload };
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "Invalid JSON body" }, 400);
    }

    const operation = body.operation;
    const payload = body.payload;

    if (operation === "sendOtp") {
      await sendOtp(user.id, payload as SendOtpPayload);
      return json({ success: true, message: "OTP sent" }, 200);
    }

    if (operation === "verifyAndUpdate") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!accessToken) {
        return json({ success: false, message: "Unauthorized" }, 401);
      }
      await verifyAndUpdate(user.id, accessToken, payload as VerifyAndUpdatePayload);
      return json({ success: true, message: "Phone updated. Please sign in again." }, 200);
    }

    return json({ success: false, message: "Unknown operation" }, 400);
  } catch (error) {
    console.error("[update-user-phone]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message.includes("already registered") || message.includes("Invalid, expired") ? 400 : 500;
    return json({ success: false, message }, status);
  }
});
