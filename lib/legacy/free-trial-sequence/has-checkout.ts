import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isDecFreeTrialClient,
  isFreeTrialProductStatut,
} from "@/lib/clients/dec-free-trial";
import { normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

/** True when this email already completed DEC free-trial checkout (client row). */
export async function hasDecFreeTrialCheckoutForEmail(
  client: SupabaseClient,
  email: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const { data } = await client
    .from("clients")
    .select("client_type, offer_type, product_statut")
    .eq("email", normalized);

  if (!data?.length) return false;

  return data.some(
    (row) =>
      isDecFreeTrialClient(row) && isFreeTrialProductStatut(row.product_statut),
  );
}
