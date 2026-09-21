/**
 * SaaS autonome — SLA / capacity snapshot for dashboard timeline.
 */

import {
  SAAS_CAPACITY,
  currentMonthKey,
} from "@/lib/capacity/constants";
import type {
  CapacitySlaSnapshot,
  ClientOutreachSlot,
} from "@/lib/capacity/types";

export function computeCapacitySla(
  slot: Pick<
    ClientOutreachSlot,
    | "inbox_allocation"
    | "rdv_goal_monthly"
    | "capacity_status"
    | "estimated_activation_at"
    | "activated_at"
    | "rdv_booked_this_month"
    | "rdv_month_key"
    | "sends_this_month"
    | "sends_month_key"
  >,
  now = new Date(),
): CapacitySlaSnapshot {
  const monthKey = currentMonthKey(now);
  const rdvBooked =
    slot.rdv_month_key === monthKey ? slot.rdv_booked_this_month : 0;
  const sends =
    slot.sends_month_key === monthKey ? slot.sends_this_month : 0;
  const goal = slot.rdv_goal_monthly || SAAS_CAPACITY.rdvGoalMonthly;

  const phase =
    slot.capacity_status === "active"
      ? "active"
      : slot.capacity_status === "paused"
        ? "paused"
        : slot.capacity_status === "queued_warmup"
          ? "queued"
          : "warmup";

  return {
    inboxAllocation: slot.inbox_allocation || SAAS_CAPACITY.inboxPerClient,
    rdvGoalMonthly: goal,
    phase,
    estimatedActivationAt:
      slot.activated_at ?? slot.estimated_activation_at ?? null,
    rdvBookedThisMonth: rdvBooked,
    sendsThisMonth: sends,
    monthlySendBudget: SAAS_CAPACITY.monthlySendBudget,
    progressPct: Math.min(100, Math.round((rdvBooked / goal) * 100)),
  };
}

/** Estimate activation date given queue position and warmup days. */
export function estimateActivationAt(
  queuePosition: number,
  warmupDays = SAAS_CAPACITY.warmupDays,
  now = new Date(),
): Date {
  const days = Math.max(0, queuePosition - 1) * 2 + warmupDays;
  const result = new Date(now);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function buildProfileCapacityBlock(
  slot: Pick<
    ClientOutreachSlot,
    | "inbox_allocation"
    | "rdv_goal_monthly"
    | "capacity_status"
    | "estimated_activation_at"
  >,
): Record<string, unknown> {
  const sla = computeCapacitySla({
    ...slot,
    activated_at: null,
    rdv_booked_this_month: 0,
    rdv_month_key: null,
    sends_this_month: 0,
    sends_month_key: null,
  });
  return {
    inbox_allocation: sla.inboxAllocation,
    rdv_goal_monthly: sla.rdvGoalMonthly,
    phase: sla.phase === "queued" ? "warmup" : sla.phase,
    estimated_activation_at: sla.estimatedActivationAt,
  };
}
