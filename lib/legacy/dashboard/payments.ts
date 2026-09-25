import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardPaymentSchedule } from "@/lib/legacy/dashboard/types";

/** Agence product and `payments.agence_id` were removed from prod. */
export async function hasSucceededPayment(
  _client: SupabaseClient,
  _agenceId: string,
): Promise<boolean> {
  return false;
}

/** @deprecated Agence product removed */
export async function getAgencePaymentSchedule(
  _client: SupabaseClient,
  _agenceId: string,
  deliveryComplete: boolean,
): Promise<DashboardPaymentSchedule | null> {
  void deliveryComplete;
  return null;
}

export type ComptablePaymentOwner = "comptable" | "entreprise" | "cif";

export async function hasSucceededPaymentComptable(
  client: SupabaseClient,
  leadId: string,
  _owner: ComptablePaymentOwner = "comptable",
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id, offer_type")
    .eq("lead_id", leadId)
    .eq("status", "succeeded")
    .limit(1);

  if (error) {
    throw new Error(`payments comptable lookup failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export async function getComptablePaymentDetails(
  client: SupabaseClient,
  leadId: string,
  _owner: ComptablePaymentOwner = "comptable",
): Promise<{ offerType: string; succeededAt: string } | null> {
  const { data, error } = await client
    .from("payments")
    .select("offer_type, succeeded_at")
    .eq("lead_id", leadId)
    .eq("status", "succeeded")
    .order("succeeded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`payments comptable details lookup failed: ${error.message}`);
  }

  if (!data) return null;
  return {
    offerType: data.offer_type as string,
    succeededAt: data.succeeded_at as string,
  };
}
