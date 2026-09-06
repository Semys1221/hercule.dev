import { createLinkTrackingClient, normalizeEmail } from "@/lib/link-tracking/supabase";

import type {
  CalendlySeatOnboardingRow,
  CalendlySeatOnboardingStatus,
} from "./types";

export async function findCalendlySeatOnboardingByAgenceId(
  agenceId: string,
): Promise<CalendlySeatOnboardingRow | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("calendly_seat_onboarding")
    .select("*")
    .eq("agence_id", agenceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CalendlySeatOnboardingRow | null) ?? null;
}

export async function listActiveCalendlySeatOnboarding(
  limit = 100,
): Promise<CalendlySeatOnboardingRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("calendly_seat_onboarding")
    .select("*")
    .in("status", ["awaiting_invite", "invite_pending"])
    .order("started_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CalendlySeatOnboardingRow[];
}

export async function insertCalendlySeatOnboarding(params: {
  agenceId: string;
  email: string;
  welcomeSentAt?: string | null;
}): Promise<CalendlySeatOnboardingRow> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("calendly_seat_onboarding")
    .insert({
      agence_id: params.agenceId,
      email: normalizeEmail(params.email),
      status: "awaiting_invite",
      started_at: now,
      welcome_sent_at: params.welcomeSentAt ?? null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CalendlySeatOnboardingRow;
}

export async function updateCalendlySeatOnboarding(
  id: string,
  patch: Partial<{
    status: CalendlySeatOnboardingStatus;
    welcome_sent_at: string | null;
    reminder_sent_at: string | null;
    last_checked_at: string | null;
    calendly_invitation_status: "pending" | "accepted" | "declined" | null;
  }>,
): Promise<void> {
  const client = createLinkTrackingClient();
  const { error } = await client
    .from("calendly_seat_onboarding")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
