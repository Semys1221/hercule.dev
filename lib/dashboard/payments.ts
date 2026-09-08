import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasSucceededPayment(
  client: SupabaseClient,
  agenceId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id")
    .eq("agence_id", agenceId)
    .eq("status", "succeeded")
    .limit(1);

  if (error) {
    throw new Error(`payments lookup failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export type ComptablePaymentOwner = "comptable" | "entreprise";

function paymentOwnerColumn(owner: ComptablePaymentOwner): "comptable_id" | "entreprise_id" {
  return owner === "comptable" ? "comptable_id" : "entreprise_id";
}

export async function hasSucceededPaymentComptable(
  client: SupabaseClient,
  leadId: string,
  owner: ComptablePaymentOwner = "comptable",
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id, offer_type")
    .eq(paymentOwnerColumn(owner), leadId)
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
  owner: ComptablePaymentOwner = "comptable",
): Promise<{ offerType: string; succeededAt: string } | null> {
  const { data, error } = await client
    .from("payments")
    .select("offer_type, succeeded_at")
    .eq(paymentOwnerColumn(owner), leadId)
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
