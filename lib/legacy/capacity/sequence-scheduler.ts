/**
 * Sequence scheduler — double tap J+1 and cooloff 3 months.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { SAAS_CAPACITY } from "@/lib/legacy/capacity/constants";
import type { SequenceSchedulerResult } from "@/lib/legacy/capacity/types";

/**
 * Advance sequence states:
 * - tap1_sent + 24h → tap2_sent (mark ready; Instantly 2-step handles send)
 * - tap2_sent + no reply window → cooloff 90d on prospect
 * - cooloff expired → release prospect to available
 */
export async function runSequenceScheduler(
  client: SupabaseClient,
  now = new Date(),
): Promise<SequenceSchedulerResult> {
  let tap2Queued = 0;
  let cooloffApplied = 0;
  let cooloffReleased = 0;
  let errors = 0;

  const tap2DueBefore = new Date(
    now.getTime() - SAAS_CAPACITY.tap2DelayHours * 60 * 60 * 1000,
  ).toISOString();

  // 1. Promote tap1_sent → tap2_pending / tap2_sent after delay
  const { data: tap1Rows, error: tap1Error } = await client
    .from("lead_assignments")
    .select("id, prospect_id")
    .eq("sequence_state", "tap1_sent")
    .lt("tap1_sent_at", tap2DueBefore)
    .limit(500);

  if (tap1Error) {
    errors += 1;
  } else {
    for (const row of tap1Rows ?? []) {
      const { error } = await client
        .from("lead_assignments")
        .update({
          sequence_state: "tap2_sent",
          tap2_sent_at: now.toISOString(),
        })
        .eq("id", row.id);
      if (error) {
        errors += 1;
        continue;
      }
      await client
        .from("prospect_pool")
        .update({
          tap_count: 2,
          last_tap_at: now.toISOString(),
        })
        .eq("id", row.prospect_id);
      tap2Queued += 1;
    }
  }

  // 2. After tap2_sent for > cooldown grace (same day window + 1d), apply cooloff
  //    Prospects with reply would have sequence_state=replied — skip those.
  const cooloffGrace = new Date(
    now.getTime() - 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: tap2Rows, error: tap2Error } = await client
    .from("lead_assignments")
    .select("id, prospect_id")
    .eq("sequence_state", "tap2_sent")
    .lt("tap2_sent_at", cooloffGrace)
    .limit(500);

  if (tap2Error) {
    errors += 1;
  } else {
    const cooloffUntil = new Date(now);
    cooloffUntil.setUTCDate(
      cooloffUntil.getUTCDate() + SAAS_CAPACITY.cooloffDays,
    );

    for (const row of tap2Rows ?? []) {
      const { error: aErr } = await client
        .from("lead_assignments")
        .update({ sequence_state: "cooloff" })
        .eq("id", row.id);
      if (aErr) {
        errors += 1;
        continue;
      }
      const { error: pErr } = await client
        .from("prospect_pool")
        .update({
          status: "cooloff",
          cooloff_until: cooloffUntil.toISOString(),
          assigned_client_id: null,
        })
        .eq("id", row.prospect_id);
      if (pErr) {
        errors += 1;
        continue;
      }
      cooloffApplied += 1;
    }
  }

  // 3. Release expired cooloffs back to available
  const { data: expired, error: expiredError } = await client
    .from("prospect_pool")
    .select("id")
    .eq("status", "cooloff")
    .lt("cooloff_until", now.toISOString())
    .limit(500);

  if (expiredError) {
    errors += 1;
  } else {
    for (const row of expired ?? []) {
      const { error } = await client
        .from("prospect_pool")
        .update({
          status: "available",
          cooloff_until: null,
          tap_count: 0,
          last_tap_at: null,
          assigned_client_id: null,
        })
        .eq("id", row.id);
      if (error) {
        errors += 1;
        continue;
      }
      cooloffReleased += 1;
    }
  }

  return { tap2Queued, cooloffApplied, cooloffReleased, errors };
}
