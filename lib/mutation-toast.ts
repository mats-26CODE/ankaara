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
