import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  isMeetingBookedStatus,
  tableForLeadCategory,
  type LeadCategory,
  type LeadLookup,
  type LeadStatut,
  type LinkTrackingLead,
} from "./types";
import {
  buildCifLeadUrls,
  buildComptableLeadUrls,
  buildDashboardUrl,
  buildEntrepriseLeadUrls,
  buildJumLeadUrls,
  buildLeadUrls,
} from "./urls";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";

// Lookup order: agence → comptable → entreprise → cif → jum → client
const TABLES: LeadCategory[] = [
  "agence",
  "comptable",
  "entreprise",
  "cif",
  "jum",
  "client",
];

function mapClientRowToLead(row: Record<string, unknown>): LinkTrackingLead {
  const slug = String(row.slug ?? "");
  const email = String(row.email ?? "");
  const clientType = String(row.client_type ?? "dec");
  const profile =
    row.profile && typeof row.profile === "object"
      ? { ...(row.profile as Record<string, unknown>), client_type: clientType }
      : { client_type: clientType };

  return {
    id: String(row.id),
    email,
    statut: (row.onboarding_completed_at ? "ONBOARDED" : "NOTBOOKED") as LeadStatut,
    slug,
    instantly_lead_id: null,
    instantly_campaign_id: null,
    calendly_invitee_uri: null,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    calendly_links_synced_at: null,
    calendly_links_sync_error: null,
    booked_at: null,
    instantly_synced_at: null,
    first_name: (row.first_name as string | null) ?? null,
    company: null,
    calendly_payload: null,
    calendly_questions: null,
    scheduled_at: null,
    confirmed_at: null,
    instantly_confirmed_synced_at: null,
    onboarding_completed_at: (row.onboarding_completed_at as string | null) ?? null,
    retraction_status: (row.retraction_status as string | null) ?? null,
    retraction_ends_at: (row.retraction_ends_at as string | null) ?? null,
    retraction_waived_at: (row.retraction_waived_at as string | null) ?? null,
    product_statut: (row.product_statut as string | null) ?? null,
    profile,
    dashboard_link: buildClientDashboardUrl(slug),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

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

export function isMissingRelationError(message: string): boolean {
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  );
}

export function createLinkTrackingClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function leadFromRow(
  category: LeadCategory,
  data: Record<string, unknown>,
): LinkTrackingLead {
  if (category === "client") {
    return mapClientRowToLead(data);
  }
  return data as unknown as LinkTrackingLead;
}

export async function findLeadByLink(
  client: SupabaseClient,
  slug: string,
): Promise<LeadLookup | null> {
  for (const category of TABLES) {
    const { data, error } = await client
      .from(tableForLeadCategory(category))
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error.message)) {
        continue;
      }
      throw new Error(`Supabase lookup failed on ${category}: ${error.message}`);
    }
    if (data) {
      return { category, lead: leadFromRow(category, data as Record<string, unknown>) };
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
      .from(tableForLeadCategory(category))
      .select("*")
      .eq("email", normalized)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error.message)) {
        continue;
      }
      throw new Error(`Supabase lookup failed on ${category}: ${error.message}`);
    }
    if (data) {
      return { category, lead: leadFromRow(category, data as Record<string, unknown>) };
    }
  }
  return null;
}

export async function findLeadByCalendlyInviteeUri(
  client: SupabaseClient,
  inviteeUri: string,
): Promise<LeadLookup | null> {
  const normalized = inviteeUri.trim();
  if (!normalized) {
    return null;
  }

  for (const category of TABLES) {
    if (category === "client") {
      continue;
    }
    const { data, error } = await client
      .from(tableForLeadCategory(category))
      .select("*")
      .eq("calendly_invitee_uri", normalized)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error.message)) {
        continue;
      }
      throw new Error(`Supabase lookup failed on ${category}: ${error.message}`);
    }
    if (data) {
      return { category, lead: leadFromRow(category, data as Record<string, unknown>) };
    }
  }
  return null;
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

async function findLeadsInTableByColumn(
  client: SupabaseClient,
  category: LeadCategory,
  column: "email" | "slug" | "calendly_invitee_uri",
  values: string[],
): Promise<LinkTrackingLead[]> {
  if (values.length === 0) {
    return [];
  }

  // #region agent log
  const bulkLookupStartedAt = Date.now();
  const valuesCharLength = values.reduce((sum, value) => sum + value.length, 0);
  let supabaseHost = "unknown";
  try {
    supabaseHost = new URL(getSupabaseUrl()).host;
  } catch {
    supabaseHost = "invalid-url";
  }
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "96fa0c" },
    body: JSON.stringify({
      sessionId: "96fa0c",
      runId: "pre-fix",
      hypothesisId: "H1-H3",
      location: "supabase.ts:findLeadsInTableByColumn:start",
      message: "Bulk lookup starting",
      data: {
        category,
        column,
        valueCount: values.length,
        valuesCharLength,
        avgValueLength: values.length > 0 ? Math.round(valuesCharLength / values.length) : 0,
        estimatedQueryChars: valuesCharLength + column.length + category.length + 64,
        supabaseHost,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const { data, error } = await client.from(tableForLeadCategory(category)).select("*").in(column, values);

  // #region agent log
  const errRecord = error as { message?: string; cause?: unknown; code?: string; details?: string } | null;
  const cause =
    errRecord?.cause && typeof errRecord.cause === "object"
      ? {
          message: (errRecord.cause as { message?: string }).message ?? null,
          code: (errRecord.cause as { code?: string }).code ?? null,
          errno: (errRecord.cause as { errno?: number }).errno ?? null,
        }
      : null;
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "96fa0c" },
    body: JSON.stringify({
      sessionId: "96fa0c",
      runId: "pre-fix",
      hypothesisId: "H1-H5",
      location: "supabase.ts:findLeadsInTableByColumn:end",
      message: "Bulk lookup finished",
      data: {
        category,
        column,
        valueCount: values.length,
        valuesCharLength,
        durationMs: Date.now() - bulkLookupStartedAt,
        rowCount: data?.length ?? 0,
        error: error?.message ?? null,
        errorCode: errRecord?.code ?? null,
        errorDetails: errRecord?.details ?? null,
        cause,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (error) {
    if (isMissingRelationError(error.message)) {
      return [];
    }
    throw new Error(`Supabase bulk lookup failed on ${category}.${column}: ${error.message}`);
  }

  if (category === "client") {
    return (data ?? []).map((row) =>
      mapClientRowToLead(row as Record<string, unknown>),
    );
  }

  return (data ?? []) as LinkTrackingLead[];
}

const BULK_EMAIL_LOOKUP_BATCH = 100;
/** Calendly invitee URIs are long (~120 chars); keep batches small to avoid undici header overflow. */
const BULK_INVITEE_URI_LOOKUP_BATCH = 20;

export async function findLeadsByEmails(
  client: SupabaseClient,
  emails: string[],
): Promise<Map<string, LeadLookup>> {
  const normalized = uniqueNonEmpty(emails.map(normalizeEmail));
  const map = new Map<string, LeadLookup>();
  if (normalized.length === 0) {
    return map;
  }

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "96fa0c" },
    body: JSON.stringify({
      sessionId: "96fa0c",
      runId: "pre-fix",
      hypothesisId: "H4",
      location: "supabase.ts:findLeadsByEmails",
      message: "Email bulk lookup starting",
      data: {
        emailCount: normalized.length,
        batchSize: BULK_EMAIL_LOOKUP_BATCH,
        tablesQueried: TABLES,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  for (let offset = 0; offset < normalized.length; offset += BULK_EMAIL_LOOKUP_BATCH) {
    const batch = normalized.slice(offset, offset + BULK_EMAIL_LOOKUP_BATCH);
    for (const category of TABLES) {
      const rows = await findLeadsInTableByColumn(client, category, "email", batch);
      for (const lead of rows) {
        const key = normalizeEmail(lead.email);
        if (!map.has(key)) {
          map.set(key, { category, lead });
        }
      }
    }
  }

  return map;
}

export async function findLeadsBySlugs(
  client: SupabaseClient,
  slugs: string[],
): Promise<Map<string, LeadLookup>> {
  const normalized = uniqueNonEmpty(slugs);
  const map = new Map<string, LeadLookup>();
  if (normalized.length === 0) {
    return map;
  }

  for (const category of TABLES) {
    const rows = await findLeadsInTableByColumn(client, category, "slug", normalized);
    for (const lead of rows) {
      const key = lead.slug?.trim();
      if (key && !map.has(key)) {
        map.set(key, { category, lead });
      }
    }
  }

  return map;
}

export async function findLeadsByCalendlyInviteeUris(
  client: SupabaseClient,
  inviteeUris: string[],
): Promise<Map<string, LeadLookup>> {
  const normalized = uniqueNonEmpty(inviteeUris);
  const map = new Map<string, LeadLookup>();
  if (normalized.length === 0) {
    return map;
  }

  // #region agent log
  const uriCharLength = normalized.reduce((sum, uri) => sum + uri.length, 0);
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "96fa0c" },
    body: JSON.stringify({
      sessionId: "96fa0c",
      runId: "pre-fix",
      hypothesisId: "H1-H2",
      location: "supabase.ts:findLeadsByCalendlyInviteeUris",
      message: "Invitee URI bulk lookup starting (unbatched)",
      data: {
        uriCount: normalized.length,
        uriCharLength,
        avgUriLength: Math.round(uriCharLength / normalized.length),
        tablesQueried: TABLES,
        batchSize: BULK_INVITEE_URI_LOOKUP_BATCH,
        inviteeLookupBatched: true,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  for (let offset = 0; offset < normalized.length; offset += BULK_INVITEE_URI_LOOKUP_BATCH) {
    const batch = normalized.slice(offset, offset + BULK_INVITEE_URI_LOOKUP_BATCH);
    for (const category of TABLES) {
      const rows = await findLeadsInTableByColumn(
        client,
        category,
        "calendly_invitee_uri",
        batch,
      );
      for (const lead of rows) {
        const key = lead.calendly_invitee_uri?.trim();
        if (key && !map.has(key)) {
          map.set(key, { category, lead });
        }
      }
    }
  }

  return map;
}

export async function findLeadById(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
): Promise<LinkTrackingLead | null> {
  const { data, error } = await client
    .from(tableForLeadCategory(category))
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase lookup failed: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  if (category === "client") {
    return mapClientRowToLead(data as Record<string, unknown>);
  }
  return data as LinkTrackingLead;
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

function buildBookingIdentityPatch(
  lookup: LeadLookup,
  params: MarkBookedParams,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const slug = lookup.lead.slug?.trim();

  if (params.calendlyInviteeUri?.trim()) {
    patch.calendly_invitee_uri = params.calendlyInviteeUri.trim();
  }
  if (params.scheduledAt) {
    patch.scheduled_at = params.scheduledAt;
  }
  if (params.firstName?.trim()) {
    patch.first_name = params.firstName.trim();
  }
  if (params.company?.trim()) {
    patch.company = params.company.trim();
  }
  if (params.calendlyPayload) {
    patch.calendly_payload = params.calendlyPayload;
  }
  if (params.calendlyQuestions) {
    patch.calendly_questions = params.calendlyQuestions;
  }

  const bookingEmail = normalizeEmail(params.email);
  const leadEmail = normalizeEmail(lookup.lead.email);
  if (bookingEmail && bookingEmail !== leadEmail) {
    patch.email = bookingEmail;
    if (slug) {
      if (lookup.category === "comptable") {
        Object.assign(patch, buildComptableLeadUrls(slug, bookingEmail));
      } else if (lookup.category === "cif") {
        Object.assign(patch, buildCifLeadUrls(slug, bookingEmail));
      } else if (lookup.category === "jum") {
        Object.assign(patch, buildJumLeadUrls(slug, bookingEmail));
      } else if (lookup.category === "agence") {
        Object.assign(patch, buildLeadUrls(slug, bookingEmail));
      } else if (lookup.category === "entreprise") {
        Object.assign(patch, buildEntrepriseLeadUrls(slug, bookingEmail));
      }
    }
  }

  return patch;
}

async function applyBookingIdentityPatch(
  client: SupabaseClient,
  lookup: LeadLookup,
  patch: Record<string, unknown>,
): Promise<LinkTrackingLead> {
  if (Object.keys(patch).length === 0) {
    return lookup.lead;
  }

  const { data, error } = await client
    .from(lookup.category)
    .update(patch)
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase booking identity sync failed: ${error.message}`);
  }

  return (data as LinkTrackingLead | null) ?? lookup.lead;
}

async function ensureDashboardLink(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LeadLookup> {
  if (
    lookup.category !== "agence" &&
    lookup.category !== "comptable" &&
    lookup.category !== "cif" &&
    lookup.category !== "jum"
  ) {
    return lookup;
  }
  if (lookup.lead.dashboard_link?.trim()) {
    return lookup;
  }

  const dashboardLink = buildDashboardUrl(lookup.lead.slug);
  const { data, error } = await client
    .from(lookup.category)
    .update({ dashboard_link: dashboardLink })
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return lookup;
  }

  return { category: lookup.category, lead: data as LinkTrackingLead };
}

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
    const identityPatch = buildBookingIdentityPatch(lookup, params);
    const syncedLead = await applyBookingIdentityPatch(client, lookup, identityPatch);
    const syncedLookup = { category: lookup.category, lead: syncedLead };
    const withDashboard = await ensureDashboardLink(client, syncedLookup);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "820c81",
      },
      body: JSON.stringify({
        sessionId: "820c81",
        runId: "post-fix",
        hypothesisId: "H1-H2",
        location: "supabase.ts:markLeadBooked:already_booked",
        message: "synced booking identity on already_booked lead",
        data: {
          slug: params.slug,
          bookingEmail: params.email,
          leadEmailBefore: lookup.lead.email,
          leadEmailAfter: withDashboard.lead.email,
          firstNameAfter: withDashboard.lead.first_name,
          companyAfter: withDashboard.lead.company,
          patchKeys: Object.keys(identityPatch),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return {
      updated: Object.keys(identityPatch).length > 0,
      lookup: withDashboard,
      reason: "already_booked",
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    statut: "MEETING_BOOKED",
    booked_at: now,
    ...buildBookingIdentityPatch(lookup, params),
  };
  if (
    lookup.category === "agence" ||
    lookup.category === "comptable" ||
    lookup.category === "cif" ||
    lookup.category === "jum"
  ) {
    patch.dashboard_link = buildDashboardUrl(lookup.lead.slug);
  }

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

  // SaaS autonome — sync lead_assignments + client slot RDV counter
  try {
    const { syncSaasAssignmentOnBooking } = await import(
      "@/lib/legacy/capacity/pipeline-bridge"
    );
    await syncSaasAssignmentOnBooking({
      client,
      email: String(data.email ?? params.email ?? ""),
      slug: lookup.lead.slug,
    });
  } catch (err) {
    console.error(
      "[markLeadBooked] saas assignment sync failed:",
      err instanceof Error ? err.message : err,
    );
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

export async function markLeadNotBooked(
  client: SupabaseClient,
  lookup: LeadLookup,
): Promise<LeadLookup> {
  const { data, error } = await client
    .from(lookup.category)
    .update({
      statut: "NOTBOOKED",
      scheduled_at: null,
      booked_at: null,
      calendly_invitee_uri: null,
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
      calendly_links_synced_at: null,
      calendly_links_sync_error: null,
      calendly_payload: null,
    })
    .eq("id", lookup.lead.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase not-booked reset failed: ${error.message}`);
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
    .from(tableForLeadCategory(category))
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
    .from(tableForLeadCategory(category))
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
    .from(tableForLeadCategory(category))
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
      .from(tableForLeadCategory(category))
      .select("*")
      .in("statut", [...BOOKED_STATUTS])
      .is("calendly_links_synced_at", null)
      .not("calendly_invitee_uri", "is", null)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error) {
      if (isMissingRelationError(error.message)) {
        continue;
      }
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
