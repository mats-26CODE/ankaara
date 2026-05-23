import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/hooks/use-products";

/** All products for catalog export (not paginated). */
export const fetchProductsForCatalogExport = async (businessId: string): Promise<Product[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
};
