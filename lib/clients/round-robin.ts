import type { SupabaseClient } from "@supabase/supabase-js";

import type { ConferenceClientType } from "@/lib/commercial/conference-pricing";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

import type { ClientProductStatut, ClientRow } from "./types";

export const FIRST_LEAD_DELAY_DAYS = 20;

export const RR_QUOTA_PROFILE_KEY = "rr_quota_consumed_at";

export type RoundRobinVertical = Extract<ConferenceClientType, "dec" | "cif" | "ias">;

export type RoundRobinEligibilityReason =
  | "eligible"
  | "too_early"
  | "no_calendly"
  | "quota_full"
  | "not_onboarded"
  | "inactive";

export type RoundRobinShare = {
  clientId: string;
  remaining: number;
  sharePct: number;
};

const INACTIVE_STATUTS = new Set<ClientProductStatut>(["CANCELLED", "ARCHIVED"]);

export function firstLeadAtFrom(createdAt: Date): string {
  const next = new Date(createdAt.getTime());
  next.setUTCDate(next.getUTCDate() + FIRST_LEAD_DELAY_DAYS);
  return next.toISOString();
}

export function leadCategoryToVertical(
  category: LeadCategory,
): RoundRobinVertical | null {
  if (category === "comptable") return "dec";
  if (category === "cif") return "cif";
  return null;
}

export function verticalToLeadCategory(
  vertical: RoundRobinVertical,
): "comptable" | "cif" | null {
  if (vertical === "dec") return "comptable";
  if (vertical === "cif") return "cif";
  return null;
}

export function remainingQuota(
  client: Pick<ClientRow, "rdv_total" | "rdv_used">,
): number {
  return Math.max(0, client.rdv_total - client.rdv_used);
}

export function clientEligibility(
  client: Pick<
    ClientRow,
    | "onboarding_completed_at"
    | "first_lead_at"
    | "rdv_total"
    | "rdv_used"
    | "calendly_scheduling_url"
    | "product_statut"
  >,
  now = new Date(),
): RoundRobinEligibilityReason {
  if (INACTIVE_STATUTS.has(client.product_statut)) {
    return "inactive";
  }
  if (!client.onboarding_completed_at?.trim()) {
    return "not_onboarded";
  }
  if (!client.calendly_scheduling_url?.trim()) {
    return "no_calendly";
  }
  if (remainingQuota(client) <= 0) {
    return "quota_full";
  }
  const firstLead = Date.parse(client.first_lead_at);
  if (!Number.isNaN(firstLead) && now.getTime() < firstLead) {
    return "too_early";
  }
  return "eligible";
}

export const ELIGIBILITY_LABELS: Record<RoundRobinEligibilityReason, string> = {
  eligible: "Éligible",
  too_early: "Trop tôt",
  no_calendly: "Sans Calendly",
  quota_full: "Quota plein",
  not_onboarded: "Onboarding",
  inactive: "Inactif",
};

export function isEligibleClient(
  client: Parameters<typeof clientEligibility>[0],
  now = new Date(),
): boolean {
  return clientEligibility(client, now) === "eligible";
}

function plannedWeight(
  client: Pick<
    ClientRow,
    | "onboarding_completed_at"
    | "rdv_total"
    | "rdv_used"
    | "calendly_scheduling_url"
    | "product_statut"
  >,
): number {
  if (INACTIVE_STATUTS.has(client.product_statut)) return 0;
  if (!client.onboarding_completed_at?.trim()) return 0;
  if (!client.calendly_scheduling_url?.trim()) return 0;
  return remainingQuota(client);
}

/** Share of remaining quota per vertical (planned RR distribution). */
export function plannedShares(
  clients: Array<
    Pick<
      ClientRow,
      | "id"
      | "client_type"
      | "onboarding_completed_at"
      | "rdv_total"
      | "rdv_used"
      | "calendly_scheduling_url"
      | "product_statut"
    >
  >,
): Map<string, RoundRobinShare> {
  const byVertical = new Map<string, typeof clients>();
  for (const client of clients) {
    const list = byVertical.get(client.client_type) ?? [];
    list.push(client);
    byVertical.set(client.client_type, list);
  }

  const result = new Map<string, RoundRobinShare>();
  for (const group of byVertical.values()) {
    const weights = group.map((client) => ({
      client,
      remaining: remainingQuota(client),
      weight: plannedWeight(client),
    }));
    const sum = weights.reduce((total, row) => total + row.weight, 0);
    for (const row of weights) {
      result.set(row.client.id, {
        clientId: row.client.id,
        remaining: row.remaining,
        sharePct: sum > 0 ? (row.weight / sum) * 100 : 0,
      });
    }
  }
  return result;
}

export function pickClient(
  eligible: Array<Pick<ClientRow, "id" | "rdv_total" | "rdv_used" | "first_lead_at">>,
  assignmentCounts: Record<string, number>,
): (typeof eligible)[number] | null {
  let best: (typeof eligible)[number] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestFirstLead = Number.POSITIVE_INFINITY;

  for (const client of eligible) {
    const remaining = remainingQuota(client);
    if (remaining <= 0) continue;
    const assigned = assignmentCounts[client.id] ?? 0;
    const score = assigned / remaining;
    const firstLead = Date.parse(client.first_lead_at);
    const firstLeadMs = Number.isNaN(firstLead) ? Number.POSITIVE_INFINITY : firstLead;
    if (
      !best ||
      score < bestScore ||
      (score === bestScore && firstLeadMs < bestFirstLead)
    ) {
      best = client;
      bestScore = score;
      bestFirstLead = firstLeadMs;
    }
  }

  return best;
}

export async function listEligibleClients(
  supabase: SupabaseClient,
  vertical: RoundRobinVertical,
  now = new Date(),
): Promise<ClientRow[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("client_type", vertical);

  if (error) {
    throw new Error(`Eligible clients lookup failed: ${error.message}`);
  }

  return ((data ?? []) as ClientRow[]).filter((row) => isEligibleClient(row, now));
}

export async function countAssignmentsByClient(
  supabase: SupabaseClient,
  vertical: RoundRobinVertical,
  clientIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const id of clientIds) {
    counts[id] = 0;
  }
  const table = verticalToLeadCategory(vertical);
  if (!table || clientIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from(table)
    .select("client_id")
    .in("client_id", clientIds)
    .neq("statut", "CANCELLED");

  if (error) {
    throw new Error(`Assignment counts failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    const id = typeof row.client_id === "string" ? row.client_id : "";
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function assignClientsForProvision(params: {
  supabase: SupabaseClient;
  category: LeadCategory;
  leadIdsNeedingAssign: string[];
}): Promise<Map<string, string>> {
  const assigned = new Map<string, string>();
  const vertical = leadCategoryToVertical(params.category);
  if (!vertical || params.leadIdsNeedingAssign.length === 0) {
    return assigned;
  }

  const eligible = await listEligibleClients(params.supabase, vertical);
  if (eligible.length === 0) {
    return assigned;
  }

  const counts = await countAssignmentsByClient(
    params.supabase,
    vertical,
    eligible.map((row) => row.id),
  );

  for (const leadId of params.leadIdsNeedingAssign) {
    const picked = pickClient(eligible, counts);
    if (!picked) break;

    const { error } = await params.supabase
      .from(params.category)
      .update({ client_id: picked.id })
      .eq("id", leadId);

    if (error) {
      throw new Error(`Round-robin assign failed: ${error.message}`);
    }

    assigned.set(leadId, picked.id);
    counts[picked.id] = (counts[picked.id] ?? 0) + 1;
  }

  return assigned;
}

export function hasConsumedRoundRobinQuota(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  const value = profile?.[RR_QUOTA_PROFILE_KEY];
  return typeof value === "string" && value.trim().length > 0;
}

export async function consumeRoundRobinQuota(params: {
  supabase: SupabaseClient;
  category: LeadCategory;
  leadId: string;
  clientId: string | null | undefined;
  profile: Record<string, unknown> | null;
}): Promise<Record<string, unknown> | null> {
  if (!params.clientId || hasConsumedRoundRobinQuota(params.profile)) {
    return params.profile;
  }

  const consumedAt = new Date().toISOString();
  const nextProfile = {
    ...(params.profile ?? {}),
    [RR_QUOTA_PROFILE_KEY]: consumedAt,
  };

  const { error: leadError } = await params.supabase
    .from(params.category)
    .update({ profile: nextProfile })
    .eq("id", params.leadId);

  if (leadError) {
    throw new Error(`Round-robin quota flag failed: ${leadError.message}`);
  }

  const { data: clientRow, error: readError } = await params.supabase
    .from("clients")
    .select("rdv_used")
    .eq("id", params.clientId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Round-robin quota read failed: ${readError.message}`);
  }

  const used = typeof clientRow?.rdv_used === "number" ? clientRow.rdv_used : 0;
  const { error: clientError } = await params.supabase
    .from("clients")
    .update({ rdv_used: used + 1 })
    .eq("id", params.clientId);

  if (clientError) {
    throw new Error(`Round-robin quota consume failed: ${clientError.message}`);
  }

  return nextProfile;
}

export async function restoreRoundRobinQuota(params: {
  supabase: SupabaseClient;
  category: LeadCategory;
  leadId: string;
  clientId: string | null | undefined;
  profile: Record<string, unknown> | null;
}): Promise<Record<string, unknown> | null> {
  if (!params.clientId || !hasConsumedRoundRobinQuota(params.profile)) {
    return params.profile;
  }

  const nextProfile = { ...(params.profile ?? {}) };
  delete nextProfile[RR_QUOTA_PROFILE_KEY];

  const { error: leadError } = await params.supabase
    .from(params.category)
    .update({ profile: nextProfile })
    .eq("id", params.leadId);

  if (leadError) {
    throw new Error(`Round-robin quota restore flag failed: ${leadError.message}`);
  }

  const { data: clientRow, error: readError } = await params.supabase
    .from("clients")
    .select("rdv_used")
    .eq("id", params.clientId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Round-robin quota read failed: ${readError.message}`);
  }

  const used = typeof clientRow?.rdv_used === "number" ? clientRow.rdv_used : 0;
  const { error: clientError } = await params.supabase
    .from("clients")
    .update({ rdv_used: Math.max(0, used - 1) })
    .eq("id", params.clientId);

  if (clientError) {
    throw new Error(`Round-robin quota restore failed: ${clientError.message}`);
  }

  return nextProfile;
}
