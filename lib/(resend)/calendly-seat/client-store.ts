import { createLinkTrackingClient, normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

export type CalendlySeatOnboardingStatus =
  | "awaiting_invite"
  | "invite_pending"
  | "active"
  | "reminder_sent";

export type CalendlySeatOnboardingRow = {
  id: string;
  agence_id: string | null;
  client_id: string | null;
  email: string;
  status: CalendlySeatOnboardingStatus;
  started_at: string;
  welcome_sent_at: string | null;
  reminder_sent_at: string | null;
  last_checked_at: string | null;
  calendly_invitation_status: "pending" | "accepted" | "declined" | null;
  created_at: string;
  updated_at: string;
};

export async function findCalendlySeatOnboardingByClientId(
  clientId: string,
): Promise<CalendlySeatOnboardingRow | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("calendly_seat_onboarding")
    .select("*")
    .eq("client_id", clientId)
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

  return (data as CalendlySeatOnboardingRow | null) ?? null;
}

export async function insertCalendlySeatOnboardingForClient(params: {
  clientId: string;
  email: string;
  welcomeSentAt?: string | null;
}): Promise<CalendlySeatOnboardingRow> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("calendly_seat_onboarding")
    .insert({
      client_id: params.clientId,
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
