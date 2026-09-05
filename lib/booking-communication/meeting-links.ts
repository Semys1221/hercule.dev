import type { ParsedCalendlyInvitee } from "@/lib/calendly";
import {
  extractEventUuidFromPayload,
  getScheduledEventInvitee,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";
import {
  createLinkTrackingClient,
  listLeadsWithUnsyncedMeetingLinks,
  persistCalendlyMeetingLinks,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LeadLookup, LinkTrackingLead } from "@/lib/link-tracking/types";

import type { BookingEmailType } from "./types";

export type MeetingActionLinks = {
  joinUrl?: string;
  rescheduleUrl?: string;
  cancelUrl?: string;
};

export const FOLLOW_UP_EMAIL_TYPES: BookingEmailType[] = [
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_24",
];

export function shouldIncludeMeetingActions(
  emailType: BookingEmailType,
): boolean {
  return FOLLOW_UP_EMAIL_TYPES.includes(emailType);
}

export function resolveUuidsFromLead(
  lead: LinkTrackingLead,
): { eventUuid: string; inviteeUuid: string } | null {
  const inviteeUri = lead.calendly_invitee_uri?.trim() ?? "";
  if (inviteeUri) {
    const parsed = parseEventAndInviteeUuids(inviteeUri);
    if (parsed) {
      return parsed;
    }
  }

  const eventUuid = extractEventUuidFromPayload(lead.calendly_payload);
  const inviteeUuid = inviteeUri ? inviteeUri.split("/").pop() ?? "" : "";
  if (eventUuid && inviteeUuid) {
    return { eventUuid, inviteeUuid };
  }

  return null;
}

export function sampleMeetingActionLinks(): MeetingActionLinks {
  return {
    joinUrl: "https://meet.google.com/abc-defg-hij",
    rescheduleUrl: "https://calendly.com/reschedulings/EXAMPLE",
    cancelUrl: "https://calendly.com/cancellations/EXAMPLE",
  };
}

function linksFromRecord(lead: LinkTrackingLead): MeetingActionLinks | null {
  const cancelUrl = lead.calendly_cancel_url?.trim() || "";
  const rescheduleUrl = lead.calendly_reschedule_url?.trim() || "";
  const joinUrl = lead.calendly_join_url?.trim() || "";

  if (!cancelUrl || !rescheduleUrl) {
    return null;
  }

  const links: MeetingActionLinks = { cancelUrl, rescheduleUrl };
  if (joinUrl) {
    links.joinUrl = joinUrl;
  }
  return links;
}

function hasPersistableMeetingLinks(links: MeetingActionLinks): boolean {
  return Boolean(links.cancelUrl?.trim() && links.rescheduleUrl?.trim());
}

export async function fetchMeetingActionLinksFromCalendly(
  lead: LinkTrackingLead,
): Promise<MeetingActionLinks | null> {
  const uuids = resolveUuidsFromLead(lead);
  if (!uuids) {
    return null;
  }

  const links = await getScheduledEventInvitee(
    uuids.eventUuid,
    uuids.inviteeUuid,
  );
  const resolved: MeetingActionLinks = {
    cancelUrl: links.cancelUrl,
    rescheduleUrl: links.rescheduleUrl,
  };
  if (links.joinUrl) {
    resolved.joinUrl = links.joinUrl;
  }
  return resolved;
}

export async function persistMeetingActionLinksForLead(
  lookup: LeadLookup,
  links: MeetingActionLinks,
  extra?: {
    calendlyInviteeUri?: string | null;
    scheduledAt?: string | null;
    calendlyPayload?: Record<string, unknown> | null;
    syncError?: string | null;
  },
): Promise<LinkTrackingLead> {
  const client = createLinkTrackingClient();
  const synced = hasPersistableMeetingLinks(links);

  return persistCalendlyMeetingLinks(client, lookup, {
    joinUrl: links.joinUrl ?? null,
    rescheduleUrl: links.rescheduleUrl ?? null,
    cancelUrl: links.cancelUrl ?? null,
    calendlyInviteeUri: extra?.calendlyInviteeUri,
    scheduledAt: extra?.scheduledAt,
    calendlyPayload: extra?.calendlyPayload,
    synced,
    syncError: synced ? null : extra?.syncError ?? "missing_cancel_or_reschedule",
  });
}

async function resolveLinksFromWebhookAndApi(
  invitee: Pick<
    ParsedCalendlyInvitee,
    | "eventUuid"
    | "inviteeUuid"
    | "cancelUrl"
    | "rescheduleUrl"
    | "joinUrl"
  >,
): Promise<MeetingActionLinks | null> {
  let cancelUrl = invitee.cancelUrl.trim();
  let rescheduleUrl = invitee.rescheduleUrl.trim();
  let joinUrl = invitee.joinUrl?.trim() || "";

  if ((!cancelUrl || !rescheduleUrl || !joinUrl) && invitee.eventUuid && invitee.inviteeUuid) {
    const apiLinks = await getScheduledEventInvitee(
      invitee.eventUuid,
      invitee.inviteeUuid,
    );
    if (!cancelUrl) cancelUrl = apiLinks.cancelUrl;
    if (!rescheduleUrl) rescheduleUrl = apiLinks.rescheduleUrl;
    if (!joinUrl && apiLinks.joinUrl) joinUrl = apiLinks.joinUrl;
  }

  if (!cancelUrl || !rescheduleUrl) {
    return null;
  }

  const links: MeetingActionLinks = { cancelUrl, rescheduleUrl };
  if (joinUrl) {
    links.joinUrl = joinUrl;
  }
  return links;
}

export type SyncCalendlyMeetingLinksParams = {
  lookup: LeadLookup;
  invitee: ParsedCalendlyInvitee;
  calendlyPayload?: Record<string, unknown> | null;
};

export async function syncCalendlyMeetingLinks(
  params: SyncCalendlyMeetingLinksParams,
): Promise<{ ok: boolean; lead: LinkTrackingLead; error?: string }> {
  const { lookup, invitee, calendlyPayload } = params;

  try {
    const links = await resolveLinksFromWebhookAndApi(invitee);
    if (!links) {
      const error = "missing_cancel_or_reschedule";
      const lead = await persistMeetingActionLinksForLead(lookup, {}, {
        calendlyInviteeUri: invitee.inviteeUri,
        scheduledAt: invitee.startTime || null,
        calendlyPayload,
        syncError: error,
      });
      return { ok: false, lead, error };
    }

    const lead = await persistMeetingActionLinksForLead(lookup, links, {
      calendlyInviteeUri: invitee.inviteeUri,
      scheduledAt: invitee.startTime || null,
      calendlyPayload,
    });
    return { ok: true, lead };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.warn("[booking-communication] syncCalendlyMeetingLinks failed:", error);
    try {
      const lead = await persistMeetingActionLinksForLead(lookup, {}, {
        calendlyInviteeUri: invitee.inviteeUri,
        scheduledAt: invitee.startTime || null,
        calendlyPayload,
        syncError: error,
      });
      return { ok: false, lead, error };
    } catch (persistErr) {
      console.error(
        "[booking-communication] Failed to persist Calendly link sync error:",
        persistErr,
      );
      return { ok: false, lead: lookup.lead, error };
    }
  }
}

export async function retryUnsyncedMeetingLinks(
  limit = 20,
): Promise<{ attempted: number; synced: number; failed: number }> {
  const client = createLinkTrackingClient();
  const leads = await listLeadsWithUnsyncedMeetingLinks(client, limit);
  let synced = 0;
  let failed = 0;

  for (const lookup of leads) {
    try {
      const links = await fetchMeetingActionLinksFromCalendly(lookup.lead);
      if (!links) {
        await persistMeetingActionLinksForLead(lookup, {}, {
          syncError: "missing_cancel_or_reschedule",
        });
        failed += 1;
        continue;
      }

      await persistMeetingActionLinksForLead(lookup, links);
      synced += 1;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.warn(
        `[booking-communication] retryUnsyncedMeetingLinks failed for ${lookup.lead.email}:`,
        error,
      );
      try {
        await persistMeetingActionLinksForLead(lookup, {}, { syncError: error });
      } catch {
        // best effort
      }
      failed += 1;
    }
  }

  return { attempted: leads.length, synced, failed };
}

/** @deprecated Use fetchMeetingActionLinksFromCalendly */
export async function resolveMeetingActionLinks(
  lead: LinkTrackingLead,
): Promise<MeetingActionLinks | null> {
  try {
    return await fetchMeetingActionLinksFromCalendly(lead);
  } catch (err) {
    console.warn(
      "[booking-communication] Could not resolve meeting action links:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export async function meetingActionLinksForRender(
  emailType: BookingEmailType,
  lead: LinkTrackingLead | null,
  sample: boolean,
  category?: LeadCategory,
): Promise<MeetingActionLinks | undefined> {
  if (!shouldIncludeMeetingActions(emailType)) {
    return undefined;
  }

  if (sample || !lead) {
    return sampleMeetingActionLinks();
  }

  const stored = linksFromRecord(lead);
  if (stored) {
    return stored;
  }

  if (!category) {
    return undefined;
  }

  try {
    const fetched = await fetchMeetingActionLinksFromCalendly(lead);
    if (!fetched) {
      return undefined;
    }

    await persistMeetingActionLinksForLead({ category, lead }, fetched);
    return fetched;
  } catch (err) {
    console.warn(
      "[booking-communication] meetingActionLinksForRender fallback failed:",
      err instanceof Error ? err.message : err,
    );
    return undefined;
  }
}
