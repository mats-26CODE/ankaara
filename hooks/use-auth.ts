import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ToastAlert } from "@/config/toast";
import { createClient } from "@/lib/supabase/client";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
  type AuthError,
} from "@supabase/supabase-js";
import { addCountryCode } from "@/helpers/helpers";

/**
 * Hook to send OTP to phone number for login,
 * we have created a supabase edge function to send OTP to phone number
 */
export const useSendOtp = (resendOtp: boolean) => {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke(
        "authenticate-user",
        {
          body: {
            operation: !resendOtp ? "login" : "resend",
            payload: {
              phone_number: addCountryCode(payload.phone),
            },
          },
        }
      );

      let errorMessage = "";

      if (error instanceof FunctionsHttpError) {
        const errorData = await error.context.json();
        errorMessage = errorData.message;
      } else if (error instanceof FunctionsRelayError) {
        errorMessage = "Relay error:" + error.message;
      } else if (error instanceof FunctionsFetchError) {
        errorMessage = "Fetch error:" + error.message;
      }

      if (errorMessage) throw new Error(errorMessage);
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("OTP sent to your phone!");
    },
    onError: (error: AuthError) => {
      const message = error.message || "Failed to send OTP. Please try again.";
      ToastAlert.error(message);
    },
  });
};

/**
 * Hook to verify OTP sent to user's phone
 */
export const useVerifyOtp = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: { phone: string; otp: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        phone: addCountryCode(payload.phone),
        token: payload.otp,
        type: "sms",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Session is automatically stored in cookies by Supabase
      if (data.user && data.session) {
        router.push("/dashboard");
        ToastAlert.success("Phone verified successfully! 🎉");
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
      if (errMsg && (data as { success?: boolean })?.success !== true)
        throw new Error(errMsg);
      return data;
    },
    onSuccess: () => {
      ToastAlert.success("OTP sent to your phone!");
    },
    onError: (error: AuthError) => {
      ToastAlert.error(error.message || "Failed to send OTP. Please try again.");
    },
  });
};

/**
 * Verify OTP for onboarding (authenticated user).
 * Uses verify-otp edge function; on success does not redirect — caller should finalize profile and redirect.
 */
export const useVerifyOtpForOnboarding = () => {
  return useMutation({
    mutationFn: async (payload: { phone: string; code: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: payload.phone, code: payload.code },
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
      if (errMsg && (data as { success?: boolean })?.success !== true)
        throw new Error(errMsg);
      return data;
    },
    onError: (error: AuthError) => {
      ToastAlert.error(
        error.message || "Invalid OTP. Please try again."
      );
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // The redirect will happen automatically
      // We'll handle the callback in a separate route
    },
    onError: (error: AuthError) => {
      const message =
        error.message || "Google authentication failed. Please try again.";
      ToastAlert.error(message);
    },
  });
};
