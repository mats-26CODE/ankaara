// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  // Authenticate user via Supabase Auth
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user?.id) {
    return Response.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  // Service-role client for DB operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { phone?: string; code?: string; fullName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!phone || !code) {
    return Response.json(
      { message: "phone and code are required" },
      { status: 400, headers: corsHeaders },
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
      { status: 400, headers: corsHeaders },
    );
  }
  const { error: updateError } = await supabase
    .from("otp_verification")
    .update({ used_at: now })
    .eq("id", row.id);
  if (updateError) {
    console.error("[verify-otp] update error:", updateError);
    return Response.json({ message: "Verification failed" }, { status: 500, headers: corsHeaders });
  }

  // Link phone and optionally display name to auth user (Admin API bypasses OTP requirement)
  const updatePayload: { phone: string; user_metadata?: Record<string, unknown> } = { phone };
  if (fullName) {
    updatePayload.user_metadata = { ...(user.user_metadata as Record<string, unknown> || {}), full_name: fullName };
  }
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, updatePayload);
  if (authUpdateError) {
    console.error("[verify-otp] auth updateUser phone error:", authUpdateError);
    // Don't fail the request - profile will still be updated by completeOnboarding
  }

  return Response.json(
    { success: true, message: "Phone verified" },
    { status: 200, headers: corsHeaders },
  );
});
