import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { BookingEmailJob } from "@/lib/booking-communication/types";

export type BookingEmailJobSummary = Pick<
  BookingEmailJob,
  | "id"
  | "lead_id"
  | "email_type"
  | "status"
  | "scheduled_for"
  | "sent_at"
  | "error_message"
  | "triggered_by"
>;

const REMINDER_EMAIL_TYPES = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
] as const;

export async function listBookingEmailJobsByLeadIds(
  leadIds: string[],
): Promise<Record<string, BookingEmailJobSummary[]>> {
  const uniqueIds = [...new Set(leadIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select(
      "id, lead_id, email_type, status, scheduled_for, sent_at, error_message, triggered_by",
    )
    .in("lead_id", uniqueIds)
    .in("email_type", REMINDER_EMAIL_TYPES)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(`Failed to list booking email jobs: ${error.message}`);
  }

  const grouped: Record<string, BookingEmailJobSummary[]> = {};
  for (const id of uniqueIds) {
    grouped[id] = [];
  }

  for (const row of (data ?? []) as BookingEmailJobSummary[]) {
    if (!grouped[row.lead_id]) {
      grouped[row.lead_id] = [];
    }
    grouped[row.lead_id].push(row);
  }

  return grouped;
}
