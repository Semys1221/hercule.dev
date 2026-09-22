import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import { findClientById } from "../supabase";
import type { ClientRow } from "../types";

export async function incrementClientRdvUsed(
  clientId: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientRow> {
  const row = await findClientById(client, clientId);
  if (!row) throw new Error("Client not found");
  const nextUsed = row.rdv_used + 1;
  const { data, error } = await client
    .from("clients")
    .update({ rdv_used: nextUsed })
    .eq("id", clientId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to increment rdv_used");
  }
  return data as ClientRow;
}

export async function decrementClientRdvUsed(
  clientId: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientRow> {
  const row = await findClientById(client, clientId);
  if (!row) throw new Error("Client not found");
  const nextUsed = Math.max(0, row.rdv_used - 1);
  const { data, error } = await client
    .from("clients")
    .update({ rdv_used: nextUsed })
    .eq("id", clientId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to decrement rdv_used");
  }
  return data as ClientRow;
}
