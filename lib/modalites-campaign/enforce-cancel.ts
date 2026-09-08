import {
  cancelScheduledEvent,
  extractEventUuidFromPayload,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  markLeadCancelled,
} from "@/lib/link-tracking/supabase";
import type { LeadLookup } from "@/lib/link-tracking/types";

import { cancelFollowUpJobs } from "@/lib/booking-communication/jobs";

export const MODALITES_ENFORCE_CANCEL_REASON =
  "Annulation automatique — absence de confirmation des modalités Hercule.";

export type EnforceModalitesCancelResult =
  | "cancelled"
  | "skipped_confirmed"
  | "skipped_already_cancelled";

export async function enforceModalitesCancelForLead(
  lookup: LeadLookup,
  reason = MODALITES_ENFORCE_CANCEL_REASON,
): Promise<EnforceModalitesCancelResult> {
  const { lead } = lookup;
  if (lead.statut === "CONFIRMED") {
    return "skipped_confirmed";
  }
  if (lead.statut === "CANCELLED") {
    return "skipped_already_cancelled";
  }

  const eventUuid =
    extractEventUuidFromPayload(lead.calendly_payload) ??
    (lead.calendly_invitee_uri
      ? parseEventAndInviteeUuids(lead.calendly_invitee_uri)?.eventUuid ?? null
      : null);
  if (eventUuid) {
    try {
      await cancelScheduledEvent(eventUuid, reason);
    } catch (err) {
      console.error("[modalites-campaign] Calendly cancel failed:", err);
    }
  } else {
    console.warn(
      `[modalites-campaign] No Calendly event UUID for lead ${lead.id}`,
    );
  }

  const client = createLinkTrackingClient();
  const cancelled = await markLeadCancelled(client, lookup);
  await cancelFollowUpJobs(cancelled.lead.id);

  try {
    await syncLeadStatutToInstantly(
      cancelled.lead,
      cancelled.category,
      "CANCELLED",
    );
  } catch (err) {
    console.error("[modalites-campaign] Instantly cancel sync failed:", err);
  }

  return "cancelled";
}
