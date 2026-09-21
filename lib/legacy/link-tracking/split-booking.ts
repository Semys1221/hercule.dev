import type { SupabaseClient } from "@supabase/supabase-js";

import { syncLeadMeetingBookedToInstantly } from "./instantly";
import {
  createLinkTrackingClient,
  markInstantlySynced,
  normalizeEmail,
} from "./supabase";
import {
  isMeetingBookedStatus,
  type LeadCategory,
  type LeadLookup,
  type LinkTrackingLead,
} from "./types";

const BOOKING_COPY_FIELDS = [
  "booked_at",
  "scheduled_at",
  "calendly_invitee_uri",
  "calendly_payload",
  "calendly_questions",
  "calendly_join_url",
  "calendly_reschedule_url",
  "calendly_cancel_url",
  "calendly_links_synced_at",
  "calendly_links_sync_error",
] as const;

export type SplitBookingPair = {
  category: LeadCategory;
  campaignEmail: LinkTrackingLead;
  bookedEmail: LinkTrackingLead;
  instantlyLeadId: string;
};

function isUnbookedCampaignStatut(statut: string): boolean {
  return statut === "NOTBOOKED" || statut === "CLICKED";
}

export function pickBookingSourceRow(rows: LinkTrackingLead[]): LinkTrackingLead | null {
  const booked = rows
    .filter((row) => isMeetingBookedStatus(row.statut))
    .sort(
      (a, b) =>
        new Date(a.booked_at ?? 0).getTime() - new Date(b.booked_at ?? 0).getTime(),
    );
  return booked[0] ?? null;
}

export function pickCampaignTargetRow(
  rows: LinkTrackingLead[],
  campaignEmail?: string | null,
): LinkTrackingLead | null {
  const normalizedCampaignEmail = normalizeEmail(campaignEmail ?? "");
  if (normalizedCampaignEmail) {
    const exact = rows.find(
      (row) =>
        normalizeEmail(row.email) === normalizedCampaignEmail &&
        isUnbookedCampaignStatut(row.statut),
    );
    if (exact) return exact;
  }

  return (
    rows.find((row) => isUnbookedCampaignStatut(row.statut)) ?? null
  );
}

export function buildBookingCopyPatch(
  source: LinkTrackingLead,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    statut: "MEETING_BOOKED",
  };

  for (const field of BOOKING_COPY_FIELDS) {
    const value = source[field];
    if (value !== null && value !== undefined) {
      patch[field] = value;
    }
  }

  if (source.first_name?.trim() && !patch.first_name) {
    patch.first_name = source.first_name.trim();
  }
  if (source.company?.trim()) {
    patch.company = source.company.trim();
  }

  return patch;
}

export async function findSplitBookingPairs(
  client: SupabaseClient,
  category: LeadCategory = "cif",
): Promise<SplitBookingPair[]> {
  const { data, error } = await client
    .from(category)
    .select("*")
    .not("instantly_lead_id", "is", null);

  if (error) {
    throw new Error(`Failed to list ${category} leads: ${error.message}`);
  }

  const byInstantlyId = new Map<string, LinkTrackingLead[]>();
  for (const row of (data ?? []) as LinkTrackingLead[]) {
    const instantlyLeadId = row.instantly_lead_id?.trim();
    if (!instantlyLeadId) continue;
    const bucket = byInstantlyId.get(instantlyLeadId) ?? [];
    bucket.push(row);
    byInstantlyId.set(instantlyLeadId, bucket);
  }

  const pairs: SplitBookingPair[] = [];
  for (const [instantlyLeadId, rows] of byInstantlyId) {
    if (rows.length < 2) continue;
    const source = pickBookingSourceRow(rows);
    if (!source) continue;

    const targets = rows.filter(
      (row) =>
        row.id !== source.id &&
        isUnbookedCampaignStatut(row.statut) &&
        normalizeEmail(row.email) !== normalizeEmail(source.email),
    );

    for (const target of targets) {
      pairs.push({
        category,
        campaignEmail: target,
        bookedEmail: source,
        instantlyLeadId,
      });
    }
  }

  return pairs;
}

export async function isCampaignLeadAlreadyBooked(
  client: SupabaseClient,
  category: LeadCategory,
  campaignEmail: string,
): Promise<boolean> {
  const email = normalizeEmail(campaignEmail);
  if (!email) return false;

  const { data: lead, error } = await client
    .from(category)
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to lookup ${email}: ${error.message}`);
  }
  if (!lead) return false;

  const row = lead as LinkTrackingLead;
  if (isMeetingBookedStatus(row.statut) || row.statut === "CONFIRMED") {
    return true;
  }

  const instantlyLeadId = row.instantly_lead_id?.trim();
  if (!instantlyLeadId) return false;

  const { data: siblings, error: siblingsError } = await client
    .from(category)
    .select("statut")
    .eq("instantly_lead_id", instantlyLeadId);

  if (siblingsError) {
    throw new Error(`Failed to lookup siblings for ${email}: ${siblingsError.message}`);
  }

  return (siblings ?? []).some((entry) =>
    isMeetingBookedStatus(String(entry.statut ?? "")),
  );
}

async function moveSalesCalls(
  client: SupabaseClient,
  category: LeadCategory,
  fromLeadId: string,
  toLeadId: string,
): Promise<number> {
  const column =
    category === "cif"
      ? "cif_id"
      : category === "comptable"
        ? "comptable_id"
        : category === "jum"
          ? "jum_id"
          : category === "agence"
            ? "agence_id"
            : null;

  if (!column) return 0;

  const { data, error } = await client
    .from("sales_calls")
    .update({ [column]: toLeadId })
    .eq(column, fromLeadId)
    .select("id");

  if (error) {
    throw new Error(`Failed to move sales_calls: ${error.message}`);
  }

  return data?.length ?? 0;
}

export type RepairSplitBookingResult = {
  ok: boolean;
  campaignEmail: string;
  bookedEmail: string;
  instantlySynced: boolean;
  salesCallsMoved: number;
  duplicateDeleted: boolean;
  reason?: string;
};

export async function repairSplitBookingPair(
  pair: SplitBookingPair,
  options: { dryRun?: boolean; campaignEmailHint?: string | null } = {},
): Promise<RepairSplitBookingResult> {
  const client = createLinkTrackingClient();
  const target =
    pickCampaignTargetRow([pair.campaignEmail, pair.bookedEmail], options.campaignEmailHint) ??
    pair.campaignEmail;
  const source = pair.bookedEmail;

  const baseResult: RepairSplitBookingResult = {
    ok: false,
    campaignEmail: target.email,
    bookedEmail: source.email,
    instantlySynced: false,
    salesCallsMoved: 0,
    duplicateDeleted: false,
  };

  if (isMeetingBookedStatus(target.statut)) {
    return { ...baseResult, ok: true, reason: "already_booked" };
  }
  if (!isMeetingBookedStatus(source.statut)) {
    return { ...baseResult, reason: "source_not_booked" };
  }

  if (options.dryRun) {
    return { ...baseResult, ok: true, reason: "dry_run" };
  }

  const patch = buildBookingCopyPatch(source);
  const { data: updated, error } = await client
    .from(pair.category)
    .update(patch)
    .eq("id", target.id)
    .in("statut", ["NOTBOOKED", "CLICKED"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update ${target.email}: ${error.message}`);
  }
  if (!updated) {
    return { ...baseResult, reason: "conditional_update_failed" };
  }

  const lookup: LeadLookup = {
    category: pair.category,
    lead: updated as LinkTrackingLead,
  };

  let instantlySynced = Boolean(lookup.lead.instantly_synced_at);
  if (!instantlySynced) {
    await syncLeadMeetingBookedToInstantly(lookup.lead, pair.category);
    await markInstantlySynced(client, pair.category, lookup.lead.id);
    instantlySynced = true;
  }

  const salesCallsMoved = await moveSalesCalls(
    client,
    pair.category,
    source.id,
    target.id,
  );

  let duplicateDeleted = false;
  if (normalizeEmail(source.email) !== normalizeEmail(target.email)) {
    const { error: deleteError } = await client
      .from(pair.category)
      .delete()
      .eq("id", source.id);

    if (deleteError) {
      throw new Error(`Failed to delete duplicate ${source.email}: ${deleteError.message}`);
    }
    duplicateDeleted = true;
  }

  return {
    ok: true,
    campaignEmail: target.email,
    bookedEmail: source.email,
    instantlySynced,
    salesCallsMoved,
    duplicateDeleted,
  };
}

export async function promoteSiblingCampaignLeads(
  lookup: LeadLookup,
): Promise<number> {
  const instantlyLeadId = lookup.lead.instantly_lead_id?.trim();
  if (!instantlyLeadId || !isMeetingBookedStatus(lookup.lead.statut)) {
    return 0;
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(lookup.category)
    .select("*")
    .eq("instantly_lead_id", instantlyLeadId);

  if (error) {
    throw new Error(`Failed to list sibling leads: ${error.message}`);
  }

  let promoted = 0;
  for (const row of (data ?? []) as LinkTrackingLead[]) {
    if (row.id === lookup.lead.id) continue;
    if (!isUnbookedCampaignStatut(row.statut)) continue;
    if (normalizeEmail(row.email) === normalizeEmail(lookup.lead.email)) continue;

    const result = await repairSplitBookingPair(
      {
        category: lookup.category,
        campaignEmail: row,
        bookedEmail: lookup.lead,
        instantlyLeadId,
      },
      { campaignEmailHint: row.email },
    );
    if (result.ok && result.reason !== "already_booked") {
      promoted += 1;
    }
  }

  return promoted;
}
