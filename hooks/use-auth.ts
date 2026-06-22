import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ToastAlert } from "@/config/toast";
import { toastMutationSuccess } from "@/lib/mutation-toast";
import { createClient } from "@/lib/supabase/client";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  type AuthError,
} from "@supabase/supabase-js";
import { addCountryCode } from "@/helpers/helpers";
import { activatePendingStaffMembership } from "@/hooks/use-staff";
import {
  enforceStaffSessionAllowed,
  StaffAccessDeniedError,
} from "@/lib/staff-auth-session";

export const AUTH_PHONE_ERROR_CODES = {
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_EXISTS: "ACCOUNT_EXISTS",
  STAFF_SUSPENDED: "STAFF_SUSPENDED",
} as const;

export type AuthPhoneErrorCode =
  (typeof AUTH_PHONE_ERROR_CODES)[keyof typeof AUTH_PHONE_ERROR_CODES];

export class AuthPhoneError extends Error {
  code: AuthPhoneErrorCode | string;

  constructor(message: string, code: AuthPhoneErrorCode | string) {
    super(message);
    this.name = "AuthPhoneError";
    this.code = code;
  }
}

type AuthenticateUserResponse = {
  error?: boolean;
  message?: string;
  code?: string;
};

const throwFromAuthenticateUserBody = (body: AuthenticateUserResponse): never => {
  const message = body.message || "Request failed";
  if (body.code) {
    throw new AuthPhoneError(message, body.code);
  }
  throw new Error(message);
};

const parseAuthenticateUserError = async (error: unknown): Promise<never> => {
  if (error instanceof FunctionsHttpError) {
    let errorData: AuthenticateUserResponse = {};
    try {
      errorData = (await error.context.json()) as AuthenticateUserResponse;
    } catch {
      throw new Error(error.message);
    }
    throwFromAuthenticateUserBody({
      error: true,
      message: errorData.message || error.message,
      code: errorData.code,
    });
  }
  if (error instanceof FunctionsRelayError) {
    throw new Error("Relay error: " + error.message);
  }
  if (error instanceof FunctionsFetchError) {
    throw new Error("Fetch error: " + error.message);
  }
  if (error instanceof Error) throw error;
  throw new Error("Failed to send OTP. Please try again.");
};

/**
 * Hook to send OTP to phone number for login or sign-up.
 * Login requires an existing account; sign-up creates the account then sends OTP.
 */
export const useSendOtp = (
  resendOtp: boolean,
  intent: "login" | "signup" = "login",
) => {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const supabase = createClient();
      const operation = resendOtp ? "resend" : intent === "signup" ? "signup" : "login";
      const { data, error } = await supabase.functions.invoke("authenticate-user", {
        body: {
          operation,
          payload: {
            phone_number: addCountryCode(payload.phone),
          },
        },
      });

      if (error) await parseAuthenticateUserError(error);

      const body = data as AuthenticateUserResponse | null;
      if (body?.error === true) {
        throwFromAuthenticateUserBody(body);
      }

      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, "OTP sent to your phone!");
    },
    onError: (error: Error) => {
      if (error instanceof AuthPhoneError) return;
      const message = error.message || "Failed to send OTP. Please try again.";
      ToastAlert.error(message);
    },
  });
};

/**
 * Hook to verify OTP sent to user's phone.
 * @param options.redirect - URL to redirect to after successful verification (e.g. /subscribe?plan=pro)
 */
export const useVerifyOtp = (options?: { redirect?: string }) => {
  const router = useRouter();
  const redirectTo = options?.redirect;

  return useMutation({
    mutationFn: async (payload: { phone: string; otp: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: addCountryCode(payload.phone),
        token: payload.otp,
        type: "sms",
      });

      if (error) throw error;

      if (data.user && data.session) {
        try {
          await enforceStaffSessionAllowed(supabase, data.user.id);
        } catch (err) {
          if (err instanceof StaffAccessDeniedError) {
            throw new AuthPhoneError(err.message, err.code);
          }
          throw err;
        }
        await activatePendingStaffMembership();
      }

      return data;
    },
    onSuccess: async (data, _variables, _onMutateResult, context) => {
      if (data.user && data.session) {
        router.replace(redirectTo ?? "/dashboard");
        toastMutationSuccess(context, "Phone verified successfully! 🎉");
      }
    },
    onError: (error: AuthError) => {
      const message = error.message || "Invalid OTP. Please try again.";
      ToastAlert.error(message);
    },
  });
};

/**
 * Send OTP for onboarding (authenticated user, e.g. after Google sign-up).
 * Uses send-otp edge function; phone should be with country code (e.g. 2557XXXXXXXX).
 */
export const useSendOtpForOnboarding = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: payload.phone },
      });
      let errMessage = "";
      if (error instanceof FunctionsHttpError) {
        try {
          const errData = await error.context.json();
          errMessage = (errData as { message?: string })?.message ?? error.message;
        } catch {
          errMessage = error.message;
        }
      } else if (error) {
        errMessage = error.message;
      }
      if (errMessage) throw new Error(errMessage);
      const errMsg = (data as { message?: string })?.message;
      if (errMsg && (data as { success?: boolean })?.success !== true) throw new Error(errMsg);
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, "OTP sent to your phone!");
    },
    onError: (error: AuthError) => {
      ToastAlert.error(error.message || "Failed to send OTP. Please try again.");
    },
  });
};

/**
 * Verify OTP for onboarding (authenticated user).
 * Uses verify-otp edge function; on success does not redirect — caller should finalize profile and redirect.
 * Pass fullName to update auth user display name (for mobile/Google users).
 */
export const useVerifyOtpForOnboarding = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string; code: string; fullName?: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          phone: payload.phone,
          code: payload.code,
          ...(payload.fullName?.trim() ? { fullName: payload.fullName.trim() } : {}),
        },
      });
      let errMessage = "";
      if (error instanceof FunctionsHttpError) {
        try {
          const errData = await error.context.json();
          errMessage = (errData as { message?: string })?.message ?? error.message;
        } catch {
          errMessage = error.message;
        }
      } else if (error) {
        errMessage = error.message;
      }
      if (errMessage) throw new Error(errMessage);
      const errMsg = (data as { message?: string })?.message;
      if (errMsg && (data as { success?: boolean })?.success !== true) throw new Error(errMsg);
      return data;
    },
    onError: (error: AuthError) => {
      ToastAlert.error(error.message || "Invalid OTP. Please try again.");
    },
  });
};

export type PhoneChangeProfilePayload = {
  full_name?: string;
  avatar_url?: string | null;
  preferred_currency?: string;
  preferred_language?: "en" | "sw";
};

const parseEdgeFunctionError = async (error: unknown): Promise<string> => {
  if (!error) return "";
  if (error instanceof FunctionsHttpError) {
    try {
      const errData = await error.context.json();
      return (errData as { message?: string })?.message ?? error.message;
    } catch {
      return error.message;
    }
  }
  if (error instanceof FunctionsRelayError) {
    return "Relay error: " + error.message;
  }
  if (error instanceof FunctionsFetchError) {
    return "Fetch error: " + error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
};

/**
 * Send OTP when changing the login phone number (profile settings).
 * Uses update-user-phone edge function.
 */
export const useSendOtpForPhoneChange = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("update-user-phone", {
        body: {
          operation: "sendOtp",
          payload: { phone: payload.phone },
        },
      });
      const errMessage = await parseEdgeFunctionError(error);
      if (errMessage) throw new Error(errMessage);
      const errMsg = (data as { message?: string })?.message;
      if (errMsg && (data as { success?: boolean })?.success !== true) {
        throw new Error(errMsg);
      }
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, "OTP sent to your phone!");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Failed to send OTP. Please try again.");
    },
  });
};

/**
 * Verify OTP, update auth + profile phone, and end all sessions (user must log in again).
 */
export const useVerifyPhoneChange = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: {
      phone: string;
      code: string;
      profile?: PhoneChangeProfilePayload;
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("update-user-phone", {
        body: {
          operation: "verifyAndUpdate",
          payload: {
            phone: payload.phone,
            code: payload.code,
            ...(payload.profile ? { profile: payload.profile } : {}),
          },
        },
      });
      const errMessage = await parseEdgeFunctionError(error);
      if (errMessage) throw new Error(errMessage);
      const errMsg = (data as { message?: string })?.message;
      if (errMsg && (data as { success?: boolean })?.success !== true) {
        throw new Error(errMsg);
      }
      await supabase.auth.signOut();
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, "Phone updated. Please sign in with your new number.");
      router.push("/login");
    },
    onError: (error: Error) => {
      ToastAlert.error(error.message || "Invalid OTP. Please try again.");
    },
  });
};

/**
 * Request email change for account linking (e.g. phone user adding email).
 * Supabase sends a confirmation email; user must click the link.
 * Updates auth user_metadata (full_name), profiles table (full_name, email), then sends confirm email.
 */
export const useUpdateUserEmail = () => {
  return useMutation({
    mutationFn: async (payload: { email: string; fullName?: string; emailRedirectTo?: string }) => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.id) throw new Error("Not authenticated");

      const emailTrimmed = payload.email.trim();
      const fullNameTrimmed = payload.fullName?.trim();

      // Update profiles table immediately (full_name, email)
      const profileUpdates = {
        email: emailTrimmed,
        ...(fullNameTrimmed ? { full_name: fullNameTrimmed } : {}),
      };
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates as any)
        .eq("id", user.id as any);

      if (profileError) throw profileError;

      // Update auth user (sends confirmation email)
      const redirectTo =
        payload.emailRedirectTo ??
        (typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined);
      const updatePayload: { email: string; data?: { full_name: string } } = {
        email: emailTrimmed,
      };
      if (fullNameTrimmed) {
        updatePayload.data = { full_name: fullNameTrimmed };
      }
      const { data, error } = await supabase.auth.updateUser(updatePayload, {
        emailRedirectTo: redirectTo,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      toastMutationSuccess(context, "Check your email and click the confirmation link to complete setup.");
    },
    onError: (error: AuthError) => {
      ToastAlert.error(error.message || "Failed to send confirmation email. Please try again.");
    },
  });
};

/**
 * Hook to login/signup with Google OAuth
 */
export const useGoogleOAuth = () => {
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (error: AuthError) => {
      const message = error.message || "Google authentication failed. Please try again.";
      ToastAlert.error(message);
    },
  });
};
