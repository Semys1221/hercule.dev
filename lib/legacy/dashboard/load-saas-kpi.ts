/**
 * Dashboard SaaS KPI — 10 RDV bookés / mois + capacity status.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeCapacitySla } from "@/lib/legacy/capacity/compute-sla";
import type { CapacitySlaSnapshot, ClientOutreachSlot } from "@/lib/legacy/capacity/types";

export type SaasDashboardKpi = CapacitySlaSnapshot & {
  slotId: string | null;
  capacityStatus: ClientOutreachSlot["capacity_status"] | null;
  hasSlot: boolean;
};

export async function loadSaasDashboardKpi(
  client: SupabaseClient,
  agenceId: string,
): Promise<SaasDashboardKpi | null> {
  const { data: slot, error } = await client
    .from("client_outreach_slots")
    .select("*")
    .eq("agence_id", agenceId)
    .maybeSingle();

  if (error) {
    console.error("[loadSaasDashboardKpi]", error.message);
    return null;
  }
  if (!slot) {
    return {
      slotId: null,
      capacityStatus: null,
      hasSlot: false,
      inboxAllocation: 30,
      rdvGoalMonthly: 10,
      phase: "warmup",
      estimatedActivationAt: null,
      rdvBookedThisMonth: 0,
      sendsThisMonth: 0,
      monthlySendBudget: 10_000,
      progressPct: 0,
    };
  }

  const typed = slot as ClientOutreachSlot;
  const sla = computeCapacitySla(typed);
  return {
    ...sla,
    slotId: typed.id,
    capacityStatus: typed.capacity_status,
    hasSlot: true,
  };
}
