import type { ParsedCalendlyInvitee } from "@/lib/calendly";
import { syncCalendlyMeetingLinks } from "@/lib/booking-communication/meeting-links";
import { upsertSalesCallFromBooking } from "@/lib/sales-calls/supabase";

import { syncLeadMeetingBookedToInstantly } from "./instantly";
import {
  createLinkTrackingClient,
  markInstantlySynced,
  markLeadBooked,
} from "./supabase";
import { isMeetingBookedStatus, type LeadCategory, type LeadLookup } from "./types";

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

async function syncInstantlyForBookedLead(lookup: LeadLookup): Promise<{
  instantlySynced: boolean;
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

  return { instantlySynced };
}

async function persistBookingSideEffects(
  lookup: LeadLookup,
  params: BookLeadFromCalendlyParams,
): Promise<LeadLookup> {
  if (lookup.category !== "agence" && lookup.category !== "comptable") {
    return lookup;
  }

  const client = createLinkTrackingClient();
  try {
    await upsertSalesCallFromBooking(client, {
      agenceId: lookup.category === "agence" ? lookup.lead.id : null,
      comptableId: lookup.category === "comptable" ? lookup.lead.id : null,
      email: lookup.lead.email,
      inviteeUri: params.invitee.inviteeUri,
      scheduledAt: params.scheduledAt ?? lookup.lead.scheduled_at,
    });
  } catch (err) {
    console.error("[link-tracking] sales_calls upsert failed:", err);
  }

  return lookup;
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

  if (result.updated || isMeetingBookedStatus(lookup.lead.statut)) {
    lookup = await persistBookingSideEffects(lookup, params);
  }

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
      const extra = await syncInstantlyForBookedLead(lookup);
      return {
        ok: true,
        updated: false,
        instantlySynced: extra.instantlySynced,
        sequenceStarted: false,
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

  const extra = await syncInstantlyForBookedLead(lookup);

  return {
    ok: true,
    updated: true,
    instantlySynced: extra.instantlySynced,
    sequenceStarted: false,
    category: lookup.category,
    email: lookup.lead.email,
    slug: lookup.lead.slug,
  };
}

export async function syncBookedLeadToInstantlyById(
  category: LeadCategory,
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
