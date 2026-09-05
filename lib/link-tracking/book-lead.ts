import type { ParsedCalendlyInvitee } from "@/lib/calendly";
import { isLegacyAgenceLead } from "@/lib/booking-communication/legacy";
import { syncCalendlyMeetingLinks } from "@/lib/booking-communication/meeting-links";
import { startSequenceForBookedLead } from "@/lib/booking-communication/route-sequence";

import {
  createLinkTrackingClient,
  markInstantlySynced,
  markLeadBooked,
} from "./supabase";
import { syncLeadMeetingBookedToInstantly } from "./instantly";
import { isMeetingBookedStatus, type LeadLookup } from "./types";

export type BookLeadFromCalendlyParams = {
  email: string;
  slug: string;
  invitee: ParsedCalendlyInvitee;
  firstName?: string | null;
  company?: string | null;
  scheduledAt?: string | null;
  calendlyPayload?: Record<string, unknown> | null;
  calendlyQuestions?: Record<string, string> | null;
};

export type BookLeadFromCalendlyResult = {
  ok: boolean;
  updated: boolean;
  instantlySynced: boolean;
  sequenceStarted?: boolean;
  reason?: string;
  category?: string;
  email?: string;
  slug?: string;
};

async function syncAndStartSequence(lookup: LeadLookup): Promise<{
  instantlySynced: boolean;
  sequenceStarted: boolean;
}> {
  const client = createLinkTrackingClient();
  let instantlySynced = false;
  try {
    await syncLeadMeetingBookedToInstantly(lookup.lead, lookup.category);
    await markInstantlySynced(client, lookup.category, lookup.lead.id);
    instantlySynced = true;
  } catch (err) {
    console.error("[link-tracking] Instantly sync failed:", err);
  }

  let sequenceStarted = false;
  if (isLegacyAgenceLead(lookup.category, lookup.lead)) {
    return { instantlySynced, sequenceStarted };
  }
  try {
    const seq = await startSequenceForBookedLead({
      category: lookup.category,
      lead: lookup.lead,
      triggeredBy: "calendly",
    });
    sequenceStarted = seq.started;
  } catch (err) {
    console.error("[link-tracking] Booking sequence failed:", err);
  }

  return { instantlySynced, sequenceStarted };
}

export async function bookLeadFromCalendly(
  params: BookLeadFromCalendlyParams,
): Promise<BookLeadFromCalendlyResult> {
  const client = createLinkTrackingClient();

  const result = await markLeadBooked(client, {
    slug: params.slug,
    email: params.email,
    calendlyInviteeUri: params.invitee.inviteeUri,
    firstName: params.firstName,
    company: params.company,
    scheduledAt: params.scheduledAt,
    calendlyPayload: params.calendlyPayload,
    calendlyQuestions: params.calendlyQuestions,
  });

  if (!result.lookup) {
    return {
      ok: true,
      updated: false,
      instantlySynced: false,
      reason: "lead_not_found",
    };
  }

  let lookup = result.lookup;
  try {
    const sync = await syncCalendlyMeetingLinks({
      lookup,
      invitee: params.invitee,
      calendlyPayload: params.calendlyPayload,
    });
    lookup = { category: lookup.category, lead: sync.lead };
  } catch (err) {
    console.error("[link-tracking] Calendly meeting links sync failed:", err);
  }

  if (!result.updated) {
    const alreadySynced = Boolean(lookup.lead.instantly_synced_at);
    if (isMeetingBookedStatus(lookup.lead.statut) && !alreadySynced) {
      const extra = await syncAndStartSequence(lookup);
      return {
        ok: true,
        updated: false,
        instantlySynced: extra.instantlySynced,
        sequenceStarted: extra.sequenceStarted,
        reason: "instantly_sync_retry",
        category: lookup.category,
        email: lookup.lead.email,
        slug: lookup.lead.slug,
      };
    }

    return {
      ok: true,
      updated: false,
      instantlySynced: alreadySynced,
      reason: result.reason,
      category: lookup.category,
      email: lookup.lead.email,
      slug: lookup.lead.slug,
    };
  }

  const extra = await syncAndStartSequence(lookup);

  return {
    ok: true,
    updated: true,
    instantlySynced: extra.instantlySynced,
    sequenceStarted: extra.sequenceStarted,
    category: lookup.category,
    email: lookup.lead.email,
    slug: lookup.lead.slug,
  };
}

export async function syncBookedLeadToInstantlyById(
  category: "agence" | "entreprise",
  leadId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(category)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return { ok: false, reason: "lead_not_found" };
  }
  if (!isMeetingBookedStatus(data.statut) && data.statut !== "CONFIRMED") {
    return { ok: false, reason: "not_booked" };
  }
  if (data.instantly_synced_at) {
    return { ok: true, reason: "already_synced" };
  }

  await syncLeadMeetingBookedToInstantly(data, category);
  await markInstantlySynced(client, category, leadId);
  return { ok: true };
}
