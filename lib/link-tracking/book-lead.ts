import { isLegacyAgenceLead } from "@/lib/booking-communication/legacy";
import { startBookingSequence } from "@/lib/booking-communication/orchestrator";

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
  calendlyInviteeUri: string;
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
    const seq = await startBookingSequence({
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
    calendlyInviteeUri: params.calendlyInviteeUri,
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

  if (!result.updated) {
    const alreadySynced = Boolean(result.lookup.lead.instantly_synced_at);
    if (isMeetingBookedStatus(result.lookup.lead.statut) && !alreadySynced) {
      const extra = await syncAndStartSequence(result.lookup);
      return {
        ok: true,
        updated: false,
        instantlySynced: extra.instantlySynced,
        sequenceStarted: extra.sequenceStarted,
        reason: "instantly_sync_retry",
        category: result.lookup.category,
        email: result.lookup.lead.email,
        slug: result.lookup.lead.slug,
      };
    }

    return {
      ok: true,
      updated: false,
      instantlySynced: alreadySynced,
      reason: result.reason,
      category: result.lookup.category,
      email: result.lookup.lead.email,
      slug: result.lookup.lead.slug,
    };
  }

  const extra = await syncAndStartSequence(result.lookup);

  return {
    ok: true,
    updated: true,
    instantlySynced: extra.instantlySynced,
    sequenceStarted: extra.sequenceStarted,
    category: result.lookup.category,
    email: result.lookup.lead.email,
    slug: result.lookup.lead.slug,
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
