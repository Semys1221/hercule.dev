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

export async function hasSucceededPaymentComptable(
  client: SupabaseClient,
  entrepriseId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("payments")
    .select("id, offer_type")
    .eq("entreprise_id", entrepriseId)
    .eq("status", "succeeded")
    .limit(1);

  if (error) {
    throw new Error(`payments comptable lookup failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export async function getComptablePaymentDetails(
  client: SupabaseClient,
  entrepriseId: string,
): Promise<{ offerType: string; succeededAt: string } | null> {
  const { data, error } = await client
    .from("payments")
    .select("offer_type, succeeded_at")
    .eq("entreprise_id", entrepriseId)
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
