import type { SupabaseClient } from "@supabase/supabase-js";

import { generateUniqueSlug } from "@/lib/admin/slug";
import { buildDashboardUrl, buildLeadUrls } from "@/lib/link-tracking/urls";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadLookup, LinkTrackingLead } from "@/lib/link-tracking/types";

export type ProvisionRoleRecoveryLeadParams = {
  email: string;
  firstName?: string | null;
  company?: string | null;
  scheduledAt?: string | null;
  calendlyInviteeUri?: string | null;
  calendlyPayload?: Record<string, unknown> | null;
  calendlyQuestions?: Record<string, string> | null;
  slug?: string | null;
  bookedAt?: string | null;
};

export type ProvisionRoleRecoveryLeadResult =
  | { ok: true; lookup: LeadLookup; created: boolean; resolvedSlug: string }
  | {
      ok: false;
      reason: "entreprise_email_collision" | "insert_failed";
      resolvedSlug: string;
      errorMessage?: string;
    };

function urlFields(slug: string, email: string) {
  return buildLeadUrls(slug, email);
}

async function ensureDashboardLink(
  client: SupabaseClient,
  leadId: string,
  slug: string,
): Promise<LinkTrackingLead | null> {
  const dashboardLink = buildDashboardUrl(slug);
  const { data, error } = await client
    .from("agence")
    .update({ dashboard_link: dashboardLink })
    .eq("id", leadId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.warn(
      "[provision-role-recovery-lead] dashboard_link update failed:",
      error.message,
    );
    return null;
  }

  return (data as LinkTrackingLead | null) ?? null;
}

async function insertAgenceLead(
  client: SupabaseClient,
  params: ProvisionRoleRecoveryLeadParams,
  slug: string,
): Promise<{ lead: LinkTrackingLead | null; errorMessage?: string }> {
  const normalized = normalizeEmail(params.email);
  const now = params.bookedAt ?? new Date().toISOString();

  const row: Record<string, unknown> = {
    email: normalized,
    statut: "MEETING_BOOKED",
    slug,
    ...urlFields(slug, normalized),
    instantly_lead_id: null,
    instantly_campaign_id: null,
    first_name: params.firstName?.trim() || null,
    company: params.company?.trim() || null,
    calendly_questions: params.calendlyQuestions ?? {},
    scheduled_at: params.scheduledAt ?? null,
    calendly_invitee_uri: params.calendlyInviteeUri?.trim() || null,
    calendly_payload: params.calendlyPayload ?? null,
    booked_at: now,
  };

  const { data, error } = await client
    .from("agence")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    const message = error?.message ?? "insert returned no row";
    console.error("[provision-role-recovery-lead] insert failed:", message);
    return { lead: null, errorMessage: message };
  }

  const withDashboard = await ensureDashboardLink(client, data.id, slug);
  return { lead: withDashboard ?? (data as LinkTrackingLead) };
}

async function updateAgenceLead(
  client: SupabaseClient,
  leadId: string,
  params: ProvisionRoleRecoveryLeadParams,
  slug: string,
): Promise<{ lead: LinkTrackingLead | null; errorMessage?: string }> {
  const normalized = normalizeEmail(params.email);
  const now = params.bookedAt ?? new Date().toISOString();

  const patch: Record<string, unknown> = {
    statut: "MEETING_BOOKED",
    slug,
    ...urlFields(slug, normalized),
    first_name: params.firstName?.trim() || null,
    company: params.company?.trim() || null,
    scheduled_at: params.scheduledAt ?? null,
    calendly_invitee_uri: params.calendlyInviteeUri?.trim() || null,
    calendly_payload: params.calendlyPayload ?? null,
    calendly_questions: params.calendlyQuestions ?? {},
    booked_at: now,
  };

  const { data, error } = await client
    .from("agence")
    .update(patch)
    .eq("id", leadId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    const message = error?.message ?? "update returned no row";
    console.error("[provision-role-recovery-lead] update failed:", message);
    return { lead: null, errorMessage: message };
  }

  const withDashboard = await ensureDashboardLink(client, leadId, slug);
  return { lead: withDashboard ?? (data as LinkTrackingLead) };
}

export async function provisionRoleRecoveryLead(
  params: ProvisionRoleRecoveryLeadParams,
): Promise<ProvisionRoleRecoveryLeadResult> {
  const client = createLinkTrackingClient();
  const existing = await findLeadByEmail(client, params.email);

  const resolvedSlug =
    params.slug?.trim() || (await generateUniqueSlug(client));

  if (existing && existing.category !== "agence") {
    console.warn(
      `[provision-role-recovery-lead] email ${params.email} exists in ${existing.category}, skipping`,
    );
    return {
      ok: false,
      reason: "entreprise_email_collision",
      resolvedSlug,
    };
  }

  if (existing) {
    const { lead, errorMessage } = await updateAgenceLead(
      client,
      existing.lead.id,
      params,
      resolvedSlug,
    );
    if (!lead) {
      return {
        ok: false,
        reason: "insert_failed",
        resolvedSlug,
        errorMessage,
      };
    }
    return {
      ok: true,
      lookup: { category: "agence", lead },
      created: false,
      resolvedSlug,
    };
  }

  const { lead, errorMessage } = await insertAgenceLead(client, params, resolvedSlug);
  if (!lead) {
    return {
      ok: false,
      reason: "insert_failed",
      resolvedSlug,
      errorMessage,
    };
  }

  return {
    ok: true,
    lookup: { category: "agence", lead },
    created: true,
    resolvedSlug,
  };
}
