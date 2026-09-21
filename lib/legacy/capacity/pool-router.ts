/**
 * Pool router — assign available prospects to active client slots (fair-share).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SAAS_CAPACITY,
  SAAS_NICHES,
  currentMonthKey,
  type SaasNiche,
} from "@/lib/legacy/capacity/constants";
import {
  fetchAvailableProspects,
  listActiveSlotsNeedingLeads,
} from "@/lib/legacy/capacity/supabase";
import type {
  ClientOutreachSlot,
  PoolRouterRunResult,
} from "@/lib/legacy/capacity/types";
import { provisionLeadsByEmails } from "@/lib/legacy/link-tracking/provision-by-emails";

function nicheWeights(
  prefs: ClientOutreachSlot["niche_preferences"],
): Record<SaasNiche, number> {
  const weights = { ...prefs };
  let sum = 0;
  for (const n of SAAS_NICHES) {
    const w = Number(weights[n] ?? 0);
    weights[n] = w > 0 ? w : 0;
    sum += weights[n];
  }
  if (sum <= 0) {
    return { restaurant: 1, sante: 1, btp: 1 };
  }
  return weights as Record<SaasNiche, number>;
}

function pickNiche(prefs: ClientOutreachSlot["niche_preferences"]): SaasNiche {
  const weights = nicheWeights(prefs);
  const total = SAAS_NICHES.reduce((s, n) => s + weights[n], 0);
  let r = Math.random() * total;
  for (const n of SAAS_NICHES) {
    r -= weights[n];
    if (r <= 0) return n;
  }
  return "restaurant";
}

function remainingBudget(slot: ClientOutreachSlot, monthKey: string): number {
  const sends =
    slot.sends_month_key === monthKey ? slot.sends_this_month : 0;
  return Math.max(0, SAAS_CAPACITY.monthlySendBudget - sends);
}

/**
 * Assign up to `batchSize` prospects across active slots needing leads.
 * Double-tap = 2 sends per prospect — budget counts 2 per assignment.
 */
export async function runPoolRouter(
  client: SupabaseClient,
  options?: { batchSize?: number; dryRun?: boolean },
): Promise<PoolRouterRunResult> {
  const batchSize = options?.batchSize ?? 100;
  const dryRun = options?.dryRun ?? false;
  const now = new Date();
  const monthKey = currentMonthKey(now);

  const { data: runRow } = await client
    .from("pool_router_runs")
    .insert({ details: { dryRun, batchSize } })
    .select("id")
    .single();

  let assigned = 0;
  let skipped = 0;
  let errors = 0;
  const perSlot: Record<string, number> = {};

  try {
    const slots = await listActiveSlotsNeedingLeads(client, now);
    if (slots.length === 0) {
      skipped = batchSize;
      return finalize(client, runRow?.id, {
        assigned,
        skipped,
        errors,
        details: { reason: "no_active_slots", perSlot },
      });
    }

    // Round-robin fair-share
    let cursor = 0;
    for (let i = 0; i < batchSize; i += 1) {
      const slot = slots[cursor % slots.length];
      cursor += 1;

      const budget = remainingBudget(slot, monthKey);
      if (budget < 2) {
        skipped += 1;
        continue;
      }

      if (!slot.instantly_campaign_id && !dryRun) {
        skipped += 1;
        continue;
      }

      const niche = pickNiche(slot.niche_preferences);
      const prospects = await fetchAvailableProspects(client, niche, 1, now);
      const prospect = prospects[0];
      if (!prospect) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        assigned += 1;
        perSlot[slot.id] = (perSlot[slot.id] ?? 0) + 1;
        continue;
      }

      try {
        const { error: claimError } = await client
          .from("prospect_pool")
          .update({
            status: "assigned",
            assigned_client_id: slot.id,
          })
          .eq("id", prospect.id)
          .eq("status", "available");

        if (claimError) {
          errors += 1;
          continue;
        }

        const { data: assignment, error: assignError } = await client
          .from("lead_assignments")
          .insert({
            prospect_id: prospect.id,
            client_slot_id: slot.id,
            sequence_state: "tap1_pending",
          })
          .select("id")
          .single();

        if (assignError || !assignment) {
          await client
            .from("prospect_pool")
            .update({ status: "available", assigned_client_id: null })
            .eq("id", prospect.id);
          errors += 1;
          continue;
        }

        // Provision link-tracking + Instantly custom vars when campaign known
        if (slot.instantly_campaign_id && slot.instantly_list_id) {
          try {
            await provisionLeadsByEmails({
              emails: [prospect.email],
              category: "agence",
              campaignId: slot.instantly_campaign_id,
              listId: slot.instantly_list_id,
            });
          } catch {
            // Non-fatal — assignment still recorded; cron recovery can provision
          }
        }

        const prevSends =
          slot.sends_month_key === monthKey ? slot.sends_this_month : 0;
        await client
          .from("client_outreach_slots")
          .update({
            sends_this_month: prevSends + 2,
            sends_month_key: monthKey,
          })
          .eq("id", slot.id);

        // Optimistic local update for remaining budget in this run
        slot.sends_this_month = prevSends + 2;
        slot.sends_month_key = monthKey;

        await client
          .from("prospect_pool")
          .update({ status: "in_sequence" })
          .eq("id", prospect.id);

        await client
          .from("lead_assignments")
          .update({
            sequence_state: "tap1_sent",
            tap1_sent_at: now.toISOString(),
          })
          .eq("id", assignment.id);

        assigned += 1;
        perSlot[slot.id] = (perSlot[slot.id] ?? 0) + 1;
      } catch {
        errors += 1;
      }
    }

    return finalize(client, runRow?.id, {
      assigned,
      skipped,
      errors,
      details: { perSlot, monthKey, slots: slots.length },
    });
  } catch (err) {
    errors += 1;
    return finalize(client, runRow?.id, {
      assigned,
      skipped,
      errors,
      details: {
        fatal: err instanceof Error ? err.message : String(err),
        perSlot,
      },
    });
  }
}

async function finalize(
  client: SupabaseClient,
  runId: string | undefined,
  result: PoolRouterRunResult,
): Promise<PoolRouterRunResult> {
  if (runId) {
    await client
      .from("pool_router_runs")
      .update({
        finished_at: new Date().toISOString(),
        assigned_count: result.assigned,
        skipped_count: result.skipped,
        error_count: result.errors,
        details: result.details,
      })
      .eq("id", runId);
  }
  return result;
}
