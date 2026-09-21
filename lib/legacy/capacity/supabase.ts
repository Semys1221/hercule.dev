/**
 * Supabase helpers for SaaS capacity tables.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import {
  DEFAULT_NICHE_PREFERENCES,
  SAAS_CAPACITY,
  currentMonthKey,
  type SaasNiche,
} from "@/lib/legacy/capacity/constants";
import { estimateActivationAt } from "@/lib/legacy/capacity/compute-sla";
import type {
  ClientOutreachSlot,
  InboxPoolRow,
  InboxProvisionQueueRow,
  LeadAssignment,
  ProspectPoolRow,
} from "@/lib/legacy/capacity/types";

export function createCapacityClient(): SupabaseClient {
  return createLinkTrackingClient();
}

export async function listActiveSlotsNeedingLeads(
  client: SupabaseClient,
  now = new Date(),
): Promise<ClientOutreachSlot[]> {
  const monthKey = currentMonthKey(now);
  const { data, error } = await client
    .from("client_outreach_slots")
    .select("*")
    .eq("capacity_status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as ClientOutreachSlot[]).filter((slot) => {
    const booked =
      slot.rdv_month_key === monthKey ? slot.rdv_booked_this_month : 0;
    const sends =
      slot.sends_month_key === monthKey ? slot.sends_this_month : 0;
    return (
      booked < (slot.rdv_goal_monthly || SAAS_CAPACITY.rdvGoalMonthly) &&
      sends < SAAS_CAPACITY.monthlySendBudget
    );
  });
}

export async function fetchAvailableProspects(
  client: SupabaseClient,
  niche: SaasNiche,
  limit: number,
  now = new Date(),
): Promise<ProspectPoolRow[]> {
  const { data, error } = await client
    .from("prospect_pool")
    .select("*")
    .eq("niche", niche)
    .eq("status", "available")
    .or(`cooloff_until.is.null,cooloff_until.lt.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProspectPoolRow[];
}

export async function countPoolByNiche(
  client: SupabaseClient,
): Promise<Record<SaasNiche, number>> {
  const counts: Record<SaasNiche, number> = {
    restaurant: 0,
    sante: 0,
    btp: 0,
  };
  for (const niche of Object.keys(counts) as SaasNiche[]) {
    const { count, error } = await client
      .from("prospect_pool")
      .select("id", { count: "exact", head: true })
      .eq("niche", niche)
      .eq("status", "available");
    if (error) throw new Error(error.message);
    counts[niche] = count ?? 0;
  }
  return counts;
}

export async function createClientSlotForAgence(params: {
  client: SupabaseClient;
  agenceId: string;
  nichePreferences?: Record<SaasNiche, number>;
}): Promise<{ slot: ClientOutreachSlot; queueTicket: InboxProvisionQueueRow }> {
  const { client, agenceId } = params;
  const { count } = await client
    .from("client_outreach_slots")
    .select("id", { count: "exact", head: true })
    .in("capacity_status", ["queued_warmup", "active", "paused"]);

  const queuePosition = (count ?? 0) + 1;
  const estimated = estimateActivationAt(queuePosition).toISOString();

  const { data: slot, error } = await client
    .from("client_outreach_slots")
    .insert({
      agence_id: agenceId,
      niche_preferences:
        params.nichePreferences ?? DEFAULT_NICHE_PREFERENCES,
      inbox_allocation: SAAS_CAPACITY.inboxPerClient,
      capacity_status: "queued_warmup",
      rdv_goal_monthly: SAAS_CAPACITY.rdvGoalMonthly,
      queue_position: queuePosition,
      estimated_activation_at: estimated,
      sends_month_key: currentMonthKey(),
      rdv_month_key: currentMonthKey(),
    })
    .select("*")
    .single();

  if (error || !slot) {
    throw new Error(error?.message ?? "Failed to create client outreach slot");
  }

  const { data: ticket, error: ticketError } = await client
    .from("inbox_provision_queue")
    .insert({
      client_slot_id: slot.id,
      inboxes_requested: SAAS_CAPACITY.inboxPerClient,
      status: "pending",
      notes: `Auto ticket — provision ${SAAS_CAPACITY.inboxPerClient} inbox for agence ${agenceId}`,
    })
    .select("*")
    .single();

  if (ticketError || !ticket) {
    throw new Error(
      ticketError?.message ?? "Failed to create inbox provision queue ticket",
    );
  }

  return {
    slot: slot as ClientOutreachSlot,
    queueTicket: ticket as InboxProvisionQueueRow,
  };
}

export async function listInboxQueue(
  client: SupabaseClient,
): Promise<
  Array<
    InboxProvisionQueueRow & {
      slot?: ClientOutreachSlot | null;
    }
  >
> {
  const { data, error } = await client
    .from("inbox_provision_queue")
    .select("*, client_outreach_slots(*)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as InboxProvisionQueueRow & {
      client_outreach_slots?: ClientOutreachSlot | ClientOutreachSlot[] | null;
    };
    const slotRaw = r.client_outreach_slots;
    const slot = Array.isArray(slotRaw) ? slotRaw[0] ?? null : slotRaw ?? null;
    const { client_outreach_slots: _, ...rest } = r;
    return { ...rest, slot };
  });
}

export async function listSlots(
  client: SupabaseClient,
): Promise<ClientOutreachSlot[]> {
  const { data, error } = await client
    .from("client_outreach_slots")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientOutreachSlot[];
}

export async function listRecentRouterRuns(
  client: SupabaseClient,
  limit = 20,
): Promise<
  Array<{
    id: string;
    started_at: string;
    finished_at: string | null;
    assigned_count: number;
    skipped_count: number;
    error_count: number;
    details: Record<string, unknown>;
  }>
> {
  const { data, error } = await client
    .from("pool_router_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    started_at: string;
    finished_at: string | null;
    assigned_count: number;
    skipped_count: number;
    error_count: number;
    details: Record<string, unknown>;
  }>;
}

export async function listInboxesForSlot(
  client: SupabaseClient,
  slotId: string,
): Promise<InboxPoolRow[]> {
  const { data, error } = await client
    .from("inbox_pool")
    .select("*")
    .eq("client_slot_id", slotId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as InboxPoolRow[];
}

export async function findAssignmentByInstantlyLead(
  client: SupabaseClient,
  instantlyLeadId: string,
): Promise<LeadAssignment | null> {
  const { data, error } = await client
    .from("lead_assignments")
    .select("*")
    .eq("instantly_lead_id", instantlyLeadId)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LeadAssignment | null) ?? null;
}

export async function markAssignmentBooked(params: {
  client: SupabaseClient;
  assignmentId: string;
  slotId: string;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const monthKey = currentMonthKey(now);
  const { error } = await params.client
    .from("lead_assignments")
    .update({
      sequence_state: "booked",
      booked_at: now.toISOString(),
    })
    .eq("id", params.assignmentId);
  if (error) throw new Error(error.message);

  const { data: slot } = await params.client
    .from("client_outreach_slots")
    .select("rdv_booked_this_month, rdv_month_key")
    .eq("id", params.slotId)
    .maybeSingle();

  const prev =
    slot?.rdv_month_key === monthKey ? (slot.rdv_booked_this_month ?? 0) : 0;

  await params.client
    .from("client_outreach_slots")
    .update({
      rdv_booked_this_month: prev + 1,
      rdv_month_key: monthKey,
    })
    .eq("id", params.slotId);
}
