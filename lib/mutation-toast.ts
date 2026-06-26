import type { MutationFunctionContext } from "@tanstack/react-query";

import { ToastAlert } from "@/config/toast";

export type MutationToastMeta = {
  /** Override the default success message from the hook. */
  successMessage?: string;
  /** Set `false` on `mutate(..., { meta })` to suppress the success toast. */
  showSuccessToast?: boolean;
};

/** Pass to `mutate` / `mutateAsync` to override the success message. */
export const mutationSuccessMeta = (successMessage: string) => ({
  meta: { successMessage } satisfies MutationToastMeta,
});

/** Pass to `mutate` / `mutateAsync` to skip the success toast. */
export const mutationSuppressSuccessMeta = () => ({
  meta: { showSuccessToast: false } satisfies MutationToastMeta,
});

/**
 * Web: shows `defaultMessage` on success unless the mutate call opts out via meta.
 */
export const toastMutationSuccess = (
  context: MutationFunctionContext,
  defaultMessage?: string,
): void => {
  const meta = context.meta as MutationToastMeta | undefined;

  if (meta?.showSuccessToast === false) {
    return;
  }

  const message = (meta?.successMessage ?? defaultMessage)?.trim();

  if (message) {
    ToastAlert.success(message);
  }
};

/**
 * Maps Postgres unique-violation errors (e.g. duplicate profile email/phone) to a
 * friendly message. Falls back to `fallback`, then the raw message, then a generic line.
 */
export const getAuthConflictMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  const err = error as { code?: string; message?: string } | null;
  const rawMessage = err?.message ?? "";
  const isUniqueViolation = err?.code === "23505";

  if (isUniqueViolation && rawMessage.includes("profiles_email_key")) {
    return "This email address is already linked to another account. Please use a different email.";
  }
  if (isUniqueViolation && rawMessage.includes("user_phone_number_key")) {
    return "This phone number is already registered to another account. Please use a different number.";
  }
  if (isUniqueViolation) {
    return "Some of these details are already in use by another account.";
  }
  return rawMessage || fallback;
};
