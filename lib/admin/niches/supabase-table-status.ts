import type { SupabaseClient } from "@supabase/supabase-js";

import type { Niche } from "@/lib/admin/navigation";
import { createLinkTrackingClient, isMissingRelationError } from "@/lib/link-tracking/supabase";

export type SupabaseTableStatus = {
  niche: Niche;
  table: string;
  connected: boolean;
  row_count: number | null;
  error: string | null;
};

export async function getSupabaseTableStatusWithClient(
  client: SupabaseClient,
  niche: Niche,
): Promise<SupabaseTableStatus> {
  const table = niche;

  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    const message = error.message;
    return {
      niche,
      table,
      connected: false,
      row_count: null,
      error: isMissingRelationError(message)
        ? `Table public.${table} introuvable`
        : message,
    };
  }

  return {
    niche,
    table,
    connected: true,
    row_count: count ?? 0,
    error: null,
  };
}

export async function getSupabaseTableStatus(niche: Niche): Promise<SupabaseTableStatus> {
  const client = createLinkTrackingClient();
  return getSupabaseTableStatusWithClient(client, niche);
}
