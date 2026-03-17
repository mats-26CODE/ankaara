"use server";

import { createAnonClient } from "@/lib/supabase/server";

export const acceptQuotation = async (quotationId: string): Promise<{ success: boolean; error?: string }> => {
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("accept_quotation", {
    p_quotation_id: quotationId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: data === true };
};
