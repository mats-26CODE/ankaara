// @ts-nocheck
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

type LoginPayload = { phone_number: string };
type ResendPayload = { phone_number: string };
type SendOtpCodesPayload = { phone_number: string };
type AuthFunctionOperation = "login" | "resend" | "sendOtpCodes";
type AuthFunctionPayload = LoginPayload | ResendPayload | SendOtpCodesPayload;

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

const login = async ({ phone_number }: LoginPayload) => {
  validatePhone(phone_number);

  let userId = "";

  const { data: existingUser, error: existingUserError } = await serviceClient.rpc(
    "get_user_by_phone",
    { phone_number },
  );

  if (existingUserError) throw existingUserError;

  if (existingUser.length === 0) {
    const { data: newUser, error: userCreateError } = await serviceClient.auth.admin.createUser({
      phone: phone_number,
      user_metadata: { user_type: "user", phone: phone_number },
    });

    if (userCreateError) throw userCreateError;
    userId = newUser.user.id;
  } else {
    userId = existingUser[0].id;
  }

  let code = "";

  if (TEST_ACCOUNTS.includes(phone_number)) {
    code = Deno.env.get("TEST_ACCOUNT_CODE") as string;
  } else {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const smsResponse = await sendCodeSms(phone_number, code, userId);
    // Beem returns { successful: true } at top level - NOT smsResponse.data.successful
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

const resend = async ({ phone_number }: ResendPayload) => {
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

  let code = "";

  if (TEST_ACCOUNTS.includes(phone_number)) {
    code = Deno.env.get("TEST_ACCOUNT_CODE") as string;
  } else {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const smsResponse = await sendCodeSms(phone_number, code, userId);
    // Beem returns { successful: true } at top level - NOT smsResponse.data.successful
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
      await login(payload);
    }

    if (operation === "resend") {
      await resend(payload);
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
    return new Response(
      JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers },
    );
  }
});
