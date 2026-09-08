import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { enrichBookingsForAdmin } from "@/lib/calendly/enrich-bookings";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory, LeadStatut } from "@/lib/link-tracking/types";

import { modalitesSkipReason } from "./eligibility";
import { modalitesConfirmUrlFor } from "./urls";
import type {
  ModalitesCandidate,
  ModalitesJobStatus,
  ModalitesSkipped,
} from "./types";

const MODALITES_JOB_TYPES: BookingEmailType[] = [
  "modalites_ask",
  "modalites_cancel",
  "modalites_enforce_cancel",
];

type JobRow = {
  lead_id: string;
  email_type: BookingEmailType;
  status: Exclude<ModalitesJobStatus, null>;
};

async function loadModalitesJobMap(
  leadIds: string[],
): Promise<Map<string, { ask: ModalitesJobStatus; cancel: ModalitesJobStatus; enforce: ModalitesJobStatus }>> {
  const map = new Map<
    string,
    { ask: ModalitesJobStatus; cancel: ModalitesJobStatus; enforce: ModalitesJobStatus }
  >();
  if (leadIds.length === 0) {
    return map;
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("lead_id, email_type, status")
    .in("lead_id", leadIds)
    .in("email_type", MODALITES_JOB_TYPES);

  if (error) {
    throw new Error(`Failed to load modalités jobs: ${error.message}`);
  }

  for (const row of (data ?? []) as JobRow[]) {
    const current = map.get(row.lead_id) ?? { ask: null, cancel: null, enforce: null };
    if (row.email_type === "modalites_ask") {
      current.ask = row.status;
    }
    if (row.email_type === "modalites_cancel") {
      current.cancel = row.status;
    }
    if (row.email_type === "modalites_enforce_cancel") {
      current.enforce = row.status;
    }
    map.set(row.lead_id, current);
  }
  return map;
}

export async function listModalitesCampaign(now = new Date()): Promise<{
  eligible: ModalitesCandidate[];
  skipped: ModalitesSkipped[];
}> {
  const bookings = await listUpcomingBookings({ daysAhead: 60, now });
  const enriched = await enrichBookingsForAdmin(bookings);
  const leadIds = enriched
    .map((row) => row.lead_id)
    .filter((id): id is string => Boolean(id));
  const jobs = await loadModalitesJobMap(leadIds);

  const eligible: ModalitesCandidate[] = [];
  const skipped: ModalitesSkipped[] = [];

  for (const row of enriched) {
    const reason = modalitesSkipReason({
      scheduledAt: row.start_time,
      leadId: row.lead_id,
      statut: row.statut,
      now,
    });
    const category = (row.lead_category ?? row.booking_category) as LeadCategory;
    if (reason || !row.lead_id) {
      skipped.push({
        email: row.email,
        name: row.name,
        scheduledAt: row.start_time,
        leadId: row.lead_id,
        leadCategory: row.lead_category,
        statut: row.statut,
        reason: reason ?? "no_lead",
      });
      continue;
    }

    const job = jobs.get(row.lead_id) ?? { ask: null, cancel: null, enforce: null };
    const slug = row.slug?.trim() ?? "";
    eligible.push({
      leadId: row.lead_id,
      leadCategory: category,
      email: row.email,
      name: row.name,
      firstName: row.first_name,
      company: row.company,
      slug,
      confirmUrl: slug
        ? modalitesConfirmUrlFor({ slug, email: row.email })
        : "",
      scheduledAt: row.start_time,
      statut: row.statut as LeadStatut,
      inviteeUri: row.invitee_uri,
      eventUri: row.event_uri,
      askStatus: job.ask,
      cancelStatus: job.cancel,
      enforceStatus: job.enforce,
      skipReason: null,
    });
  }

  return { eligible, skipped };
}
