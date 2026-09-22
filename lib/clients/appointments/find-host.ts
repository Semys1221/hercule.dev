import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient, normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

import type { ClientRow } from "../types";

export async function findClientByEmail(
  email: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientRow | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data: seat, error: seatError } = await client
    .from("calendly_seat_onboarding")
    .select("client_id")
    .eq("email", normalized)
    .not("client_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seatError && !seatError.message.includes("does not exist")) {
    throw new Error(seatError.message);
  }

  if (seat?.client_id) {
    const { data, error } = await client
      .from("clients")
      .select("*")
      .eq("id", seat.client_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as ClientRow;
  }

  const { data, error } = await client
    .from("clients")
    .select("*")
    .eq("email", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return null;
    }
    throw new Error(error.message);
  }
  return (data as ClientRow | null) ?? null;
}

export async function findClientHostByEmails(
  emails: string[],
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientRow | null> {
  for (const email of emails) {
    const row = await findClientByEmail(email, client);
    if (row) return row;
  }
  return null;
}
