import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import {
  CONFERENCE_SALE_WINDOW_ID,
  isConferenceCheckoutOpen,
  statusForPhase,
  toPublicSaleWindow,
  type ConferenceRegistrationPhase,
  type ConferenceSaleWindowPublic,
  type ConferenceSaleWindowRow,
} from "./sale-window";

function asRow(data: unknown): ConferenceSaleWindowRow {
  return data as ConferenceSaleWindowRow;
}

export async function getConferenceSaleWindow(
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ConferenceSaleWindowRow> {
  const { data, error } = await client
    .from("conference_sale_windows")
    .select("*")
    .eq("id", CONFERENCE_SALE_WINDOW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("conference_sale_window_missing");
  }
  return asRow(data);
}

export async function getPublicConferenceSaleWindow(
  client: SupabaseClient = createLinkTrackingClient(),
  now: Date = new Date(),
): Promise<ConferenceSaleWindowPublic> {
  const row = await getConferenceSaleWindow(client);
  return toPublicSaleWindow(row, now);
}

export async function setConferenceRegistrationPhase(
  phase: ConferenceRegistrationPhase,
  client: SupabaseClient = createLinkTrackingClient(),
  now: Date = new Date(),
): Promise<ConferenceSaleWindowRow> {
  const status = statusForPhase(phase);
  const { data, error } = await client
    .from("conference_sale_windows")
    .update({
      status,
      started_at: phase === "open" ? now.toISOString() : null,
      ends_at: null,
    })
    .eq("id", CONFERENCE_SALE_WINDOW_ID)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to set registration phase");
  }
  return asRow(data);
}

export async function assertConferenceCheckoutOpen(
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<void> {
  const row = await getConferenceSaleWindow(client);
  if (!isConferenceCheckoutOpen(row)) {
    const error = new Error("conference_sale_closed");
    error.name = "ConferenceSaleClosedError";
    throw error;
  }
}
