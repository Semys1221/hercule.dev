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
