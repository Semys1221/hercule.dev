import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  isMeetingBookedStatus,
  type LeadCategory,
  type LeadLookup,
  type LeadStatut,
  type LinkTrackingLead,
} from "./types";

const TABLES: LeadCategory[] = ["agence", "entreprise"];

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return key;
}

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return url;
}

export function createLinkTrackingClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findLeadByLink(
  client: SupabaseClient,
  slug: string,
): Promise<LeadLookup | null> {
  for (const category of TABLES) {
    const { data, error } = await client
      .from(category)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase lookup failed on ${category}: ${error.message}`);
    }
    if (data) {
      return { category, lead: data as LinkTrackingLead };
    }
  }
  return null;
}

export async function findLeadByEmail(
  client: SupabaseClient,
  email: string,
): Promise<LeadLookup | null> {
  const normalized = normalizeEmail(email);
  for (const category of TABLES) {
    const { data, error } = await client
      .from(category)
      .select("*")
      .eq("email", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase lookup failed on ${category}: ${error.message}`);
    }
    if (data) {
      return { category, lead: data as LinkTrackingLead };
    }
  }
  return null;
}

export async function findLeadById(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
): Promise<LinkTrackingLead | null> {
  const { data, error } = await client
    .from(category)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase lookup failed: ${error.message}`);
  }
  return (data as LinkTrackingLead | null) ?? null;
}

export type MarkBookedParams = {
  slug: string;
  email: string;
  calendlyInviteeUri: string;
  firstName?: string | null;
  company?: string | null;
  scheduledAt?: string | null;
  calendlyPayload?: Record<string, unknown> | null;
  calendlyQuestions?: Record<string, string> | null;
};

export type MarkBookedResult =
  | { updated: true; lookup: LeadLookup }
  | { updated: false; lookup: LeadLookup | null; reason: string };

export async function markLeadBooked(
  client: SupabaseClient,
  params: MarkBookedParams,
): Promise<MarkBookedResult> {
  let lookup = await findLeadByLink(client, params.slug);
  if (!lookup) {
    lookup = await findLeadByEmail(client, params.email);
  }
  if (!lookup) {
    return { updated: false, lookup: null, reason: "lead_not_found" };
  }

  if (lookup.lead.statut === "CONFIRMED" || lookup.lead.statut === "CANCELLED") {
    return { updated: false, lookup, reason: "already_confirmed" };
  }

  if (isMeetingBookedStatus(lookup.lead.statut)) {
    return { updated: false, lookup, reason: "already_booked" };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    statut: "MEETING_BOOKED",
    booked_at: now,
    calendly_invitee_uri: params.calendlyInviteeUri || lookup.lead.calendly_invitee_uri,
  };
  if (params.firstName) patch.first_name = params.firstName;
  if (params.company) patch.company = params.company;
  if (params.scheduledAt) patch.scheduled_at = params.scheduledAt;
  if (params.calendlyPayload) patch.calendly_payload = params.calendlyPayload;
  if (params.calendlyQuestions) patch.calendly_questions = params.calendlyQuestions;

  const { data, error } = await client
    .from(lookup.category)
    .update(patch)
    .eq("slug", lookup.lead.slug)
    .in("statut", ["NOTBOOKED", "CLICKED"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase update failed: ${error.message}`);
  }

  if (!data) {
    const refreshed = await findLeadByLink(client, lookup.lead.slug);
    if (refreshed && isMeetingBookedStatus(refreshed.lead.statut)) {
      return { updated: false, lookup: refreshed, reason: "already_booked" };
    }
    return { updated: false, lookup, reason: "conditional_update_failed" };
  }

  return {
    updated: true,
    lookup: { category: lookup.category, lead: data as LinkTrackingLead },
  };
}

export async function markLeadClicked(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LeadLookup | null> {
  if (lookup.lead.statut !== "NOTBOOKED") {
    return null;
  }

  const { data, error } = await client
    .from(lookup.category)
    .update({ statut: "CLICKED" })
    .eq("id", lookup.lead.id)
    .eq("statut", "NOTBOOKED")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase click update failed: ${error.message}`);
  }
  if (!data) return null;

  return { category: lookup.category, lead: data as LinkTrackingLead };
}

export async function markLeadConfirmed(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LeadLookup> {
  if (lookup.lead.statut === "CONFIRMED") {
    return lookup;
  }
  if (lookup.lead.statut === "CANCELLED") {
    throw new Error("lead_cancelled");
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from(lookup.category)
    .update({
      statut: "CONFIRMED",
      confirmed_at: now,
    })
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase confirm failed: ${error.message}`);
  }

  return {
    category: lookup.category,
    lead: (data as LinkTrackingLead) ?? lookup.lead,
  };
}

export async function markLeadCancelled(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LeadLookup> {
  if (lookup.lead.statut === "CANCELLED") {
    return lookup;
  }

  const { data, error } = await client
    .from(lookup.category)
    .update({
      statut: "CANCELLED",
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
      calendly_links_synced_at: null,
      calendly_links_sync_error: null,
    })
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase cancel failed: ${error.message}`);
  }

  return {
    category: lookup.category,
    lead: (data as LinkTrackingLead) ?? lookup.lead,
  };
}

export async function updateLeadStatut(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
  statut: LeadStatut,
  extra?: Record<string, unknown>,
): Promise<LinkTrackingLead> {
  const patch: Record<string, unknown> = { statut, ...(extra ?? {}) };
  if (statut === "MEETING_BOOKED" || statut === "BOOKED") {
    patch.statut = "MEETING_BOOKED";
    patch.booked_at = extra?.booked_at ?? new Date().toISOString();
  }
  if (statut === "CONFIRMED") {
    patch.confirmed_at = extra?.confirmed_at ?? new Date().toISOString();
  }

  const { data, error } = await client
    .from(category)
    .update(patch)
    .eq("id", leadId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update statut: ${error?.message ?? "no row"}`);
  }

  return data as LinkTrackingLead;
}

export async function markInstantlySynced(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
): Promise<void> {
  const { error } = await client
    .from(category)
    .update({ instantly_synced_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    throw new Error(`Failed to mark instantly_synced_at: ${error.message}`);
  }
}

export async function markInstantlyConfirmedSynced(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
): Promise<void> {
  const { error } = await client
    .from(category)
    .update({ instantly_confirmed_synced_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    throw new Error(
      `Failed to mark instantly_confirmed_synced_at: ${error.message}`,
    );
  }
}

export type PersistCalendlyMeetingLinksParams = {
  calendlyInviteeUri?: string | null;
  scheduledAt?: string | null;
  calendlyPayload?: Record<string, unknown> | null;
  joinUrl?: string | null;
  rescheduleUrl?: string | null;
  cancelUrl?: string | null;
  synced: boolean;
  syncError?: string | null;
};

export async function persistCalendlyMeetingLinks(
  client: SupabaseClient,
  lookup: LeadLookup,
  params: PersistCalendlyMeetingLinksParams,
): Promise<LinkTrackingLead> {
  const patch: Record<string, unknown> = {
    calendly_join_url: params.joinUrl ?? null,
    calendly_reschedule_url: params.rescheduleUrl ?? null,
    calendly_cancel_url: params.cancelUrl ?? null,
    calendly_links_synced_at: params.synced ? new Date().toISOString() : null,
    calendly_links_sync_error: params.synced ? null : params.syncError ?? null,
  };

  if (params.calendlyInviteeUri) {
    patch.calendly_invitee_uri = params.calendlyInviteeUri;
  }
  if (params.scheduledAt) {
    patch.scheduled_at = params.scheduledAt;
  }
  if (params.calendlyPayload) {
    patch.calendly_payload = params.calendlyPayload;
  }

  const { data, error } = await client
    .from(lookup.category)
    .update(patch)
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to persist Calendly meeting links: ${error.message}`);
  }

  return (data as LinkTrackingLead) ?? lookup.lead;
}

export async function clearCalendlyMeetingLinks(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LinkTrackingLead> {
  const { data, error } = await client
    .from(lookup.category)
    .update({
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
      calendly_links_synced_at: null,
      calendly_links_sync_error: null,
    })
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to clear Calendly meeting links: ${error.message}`);
  }

  return (data as LinkTrackingLead) ?? lookup.lead;
}

const BOOKED_STATUTS = ["MEETING_BOOKED", "CONFIRMED", "BOOKED"] as const;

export async function listLeadsWithUnsyncedMeetingLinks(
  client: SupabaseClient,
  limit: number,
): Promise<LeadLookup[]> {
  const results: LeadLookup[] = [];

  for (const category of TABLES) {
    const { data, error } = await client
      .from(category)
      .select("*")
      .in("statut", [...BOOKED_STATUTS])
      .is("calendly_links_synced_at", null)
      .not("calendly_invitee_uri", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(
        `Failed to list unsynced meeting links on ${category}: ${error.message}`,
      );
    }

    for (const row of data ?? []) {
      results.push({ category, lead: row as LinkTrackingLead });
    }
  }

  results.sort((a, b) => {
    const aTime = a.lead.scheduled_at ?? "";
    const bTime = b.lead.scheduled_at ?? "";
    return aTime.localeCompare(bTime);
  });

  return results.slice(0, limit);
}
