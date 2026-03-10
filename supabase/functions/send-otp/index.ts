import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone: string, code: string): Promise<void> {
  const apiKey = Deno.env.get("BEEM_SMS_API_KEY");
  const secretKey = Deno.env.get("BEEM_SMS_SECRET_KEY");
  const sourceAddress = Deno.env.get("BEEM_SMS_APP_ID");
  if (!apiKey || !secretKey) {
    console.log("[send-otp] BEEM_SMS_* not set; OTP (dev):", code);
    return;
  }
  const message = `Your verification code is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
  const authHeader = "Basic " + btoa(`${apiKey}:${secretKey}`);
  const response = await fetch("https://apisms.beem.africa/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
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
    throw new Error(data.message || `SMS failed: ${response.status}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json(
      { message: "Method not allowed" },
      { status: 405, headers: corsHeaders }
    );
  }
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return Response.json(
      { message: "Missing Authorization header" },
      { status: 401, headers: corsHeaders }
    );
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user?.id) {
    return Response.json(
      { message: "Invalid or expired token" },
      { status: 401, headers: corsHeaders }
    );
  }
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!phone) {
    return Response.json(
      { message: "phone is required (e.g. 2557XXXXXXXX)" },
      { status: 400, headers: corsHeaders }
    );
  }
  const code = generateOtp();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();
  try {
    await sendSms(phone, code);
  } catch (err) {
    console.error("[send-otp] SMS error:", err);
    return Response.json(
      { message: err instanceof Error ? err.message : "Failed to send SMS" },
      { status: 502, headers: corsHeaders }
    );
  }
  const { error: insertError } = await supabase.from("otp_verification").insert({
    user_id: user.id,
    phone,
    code,
    expires_at: expiresAt,
  });
  if (insertError) {
    console.error("[send-otp] DB insert error:", insertError);
    return Response.json(
      { message: "Failed to store OTP" },
      { status: 500, headers: corsHeaders }
    );
  }
  return Response.json(
    { success: true, message: "OTP sent" },
    { status: 200, headers: corsHeaders }
  );
});
