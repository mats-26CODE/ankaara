// @ts-nocheck
// Account deletion (OTP-gated). Mirrors update-user-phone:
//   operation "requestDeletionOtp" -> send an OTP to the user's current phone
//   operation "verifyAndDelete"    -> verify OTP, wipe all data, delete auth user
//
// Setup:
// - Keep verify_jwt ENABLED (this function identifies the user from their token).
// - Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//   BEEM_SMS_API_KEY, BEEM_SMS_SECRET_KEY, BEEM_SMS_APP_ID, optional TEST_ACCOUNT_CODE.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OTP_EXPIRY_MINUTES = 10;
const LOGO_BUCKET = "business-logos";

/** Same test numbers as authenticate-user; use TEST_ACCOUNT_CODE env instead of SMS. */
const TEST_ACCOUNTS = ["255767645559"];

type Operation = "requestDeletionOtp" | "verifyAndDelete";
type VerifyPayload = { code?: string };

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
    if (!testCode) throw new Error("TEST_ACCOUNT_CODE is not configured");
    return { code: testCode, skipSms: true };
  }
  return { code: generateOtp(), skipSms: false };
};

const sendSms = async (phone: string, code: string): Promise<void> => {
  const apiKey = Deno.env.get("BEEM_SMS_API_KEY");
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY");
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  if (!apiKey || !secretKey) throw new Error("SMS provider is not configured");

  const message = `Your Ankaara account deletion code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. If this wasn't you, ignore this message.`;
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
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();
  if (error || !user?.id) return null;
  return user;
};

const serviceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

/** Resolve the phone we send the deletion OTP to: auth phone, else profile phone. */
const resolveUserPhone = async (
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  authPhone: string | null,
): Promise<string> => {
  if (authPhone && authPhone.trim()) return authPhone.trim();

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .maybeSingle();

  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
  if (!phone) {
    throw new Error(
      "No phone number is linked to this account, so we can't verify deletion. Please contact support.",
    );
  }
  return phone;
};

const requestDeletionOtp = async (userId: string, authPhone: string | null) => {
  const supabase = serviceClient();
  const phone = await resolveUserPhone(supabase, userId, authPhone);

  const { code, skipSms } = resolveOtpCode(phone);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  if (!skipSms) await sendSms(phone, code);

  const { error } = await supabase.from("otp_verification").insert({
    user_id: userId,
    phone,
    code,
    expires_at: expiresAt,
  });
  if (error) throw new Error("Failed to store verification code");
};

/** Recursively collect every object path under a storage prefix. */
const listAllObjectPaths = async (
  supabase: ReturnType<typeof serviceClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> => {
  const paths: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return paths;

  for (const entry of data) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders come back with a null id and no metadata; recurse into them.
    if (entry.id === null || entry.metadata === null) {
      const nested = await listAllObjectPaths(supabase, bucket, full);
      paths.push(...nested);
    } else {
      paths.push(full);
    }
  }
  return paths;
};

const deleteUserStorage = async (
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
) => {
  try {
    const paths = await listAllObjectPaths(supabase, LOGO_BUCKET, userId);
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100);
      if (batch.length > 0) {
        await supabase.storage.from(LOGO_BUCKET).remove(batch);
      }
    }
  } catch (err) {
    // Storage cleanup is best-effort; never block account deletion on it.
    console.error("[delete-account] storage cleanup error:", err);
  }
};

const verifyAndDelete = async (
  userId: string,
  authPhone: string | null,
  accessToken: string,
  { code }: VerifyPayload,
) => {
  const codeTrimmed = typeof code === "string" ? code.trim() : "";
  if (!codeTrimmed) throw new Error("Verification code is required");

  const supabase = serviceClient();
  const now = new Date().toISOString();

  // 1. Validate OTP (scoped to this user, unused, unexpired).
  const { data: row, error: selectError } = await supabase
    .from("otp_verification")
    .select("id")
    .eq("user_id", userId)
    .eq("code", codeTrimmed)
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError || !row) {
    throw new Error("Invalid, expired or already used verification code");
  }

  const { error: markUsedError } = await supabase
    .from("otp_verification")
    .update({ used_at: now })
    .eq("id", row.id);
  if (markUsedError) throw new Error("Verification failed");

  // 2. Best-effort storage cleanup (uses owner-prefixed paths still present).
  await deleteUserStorage(supabase, userId);

  // 3. Ordered DB cleanup (handles RESTRICT foreign keys).
  const { error: rpcError } = await supabase.rpc("delete_user_account_data", {
    p_user_id: userId,
  });
  if (rpcError) {
    console.error("[delete-account] cleanup rpc error:", rpcError);
    throw new Error("Failed to delete account data. Please try again or contact support.");
  }

  // 4. Delete the auth user (cascades profiles + remaining references).
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.error("[delete-account] deleteUser error:", deleteUserError);
    throw new Error("Failed to delete account. Please try again or contact support.");
  }

  // 5. Revoke any remaining sessions (best-effort; user record is already gone).
  try {
    await supabase.auth.admin.signOut(accessToken, "global");
  } catch (err) {
    console.error("[delete-account] signOut error:", err);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return json({ success: false, message: "Unauthorized" }, 401);

    let body: { operation?: Operation; payload?: VerifyPayload };
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "Invalid JSON body" }, 400);
    }

    const authPhone = typeof user.phone === "string" ? user.phone : null;

    if (body.operation === "requestDeletionOtp") {
      await requestDeletionOtp(user.id, authPhone);
      return json({ success: true, message: "Verification code sent" }, 200);
    }

    if (body.operation === "verifyAndDelete") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
      await verifyAndDelete(user.id, authPhone, accessToken, body.payload ?? {});
      return json({ success: true, message: "Account deleted" }, 200);
    }

    return json({ success: false, message: "Unknown operation" }, 400);
  } catch (error) {
    console.error("[delete-account]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      message.includes("Invalid, expired") ||
      message.includes("required") ||
      message.includes("No phone number")
        ? 400
        : 500;
    return json({ success: false, message }, status);
  }
});
