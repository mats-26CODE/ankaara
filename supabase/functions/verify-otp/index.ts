// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { message: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!phone || !code) {
    return Response.json(
      { message: "phone and code are required" },
      { status: 400, headers: corsHeaders }
    );
  }
  const now = new Date().toISOString();
  const { data: row, error: selectError } = await supabase
    .from("otp_verification")
    .select("id")
    .eq("user_id", user.id)
    .eq("phone", phone)
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", now)
    .limit(1)
    .single();
  if (selectError || !row) {
    return Response.json(
      { message: "Invalid, expired or already used OTP" },
      { status: 400, headers: corsHeaders }
    );
  }
  const { error: updateError } = await supabase
    .from("otp_verification")
    .update({ used_at: now })
    .eq("id", row.id);
  if (updateError) {
    console.error("[verify-otp] update error:", updateError);
    return Response.json(
      { message: "Verification failed" },
      { status: 500, headers: corsHeaders }
    );
  }
  return Response.json(
    { success: true, message: "Phone verified" },
    { status: 200, headers: corsHeaders }
  );
});
