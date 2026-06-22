import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

type EdgeFunctionErrorBody = {
  message?: string;
};

export const parseEdgeFunctionError = async (error: unknown): Promise<string> => {
  if (!error) return "";
  if (error instanceof FunctionsHttpError) {
    try {
      const errData = (await error.context.json()) as EdgeFunctionErrorBody;
      return errData.message ?? error.message;
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
