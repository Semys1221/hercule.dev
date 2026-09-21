/**
 * SaaS autonome — capacity types (mirrors Supabase tables).
 */

import type { SaasNiche } from "./constants";

export type ProspectPoolStatus =
  | "available"
  | "assigned"
  | "in_sequence"
  | "booked"
  | "exhausted"
  | "cooloff";

export type CapacityStatus =
  | "queued_warmup"
  | "active"
  | "paused"
  | "churned";

export type InboxStatus = "warmup" | "active" | "paused" | "retired";

export type InboxQueueStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type SequenceState =
  | "tap1_pending"
  | "tap1_sent"
  | "tap2_pending"
  | "tap2_sent"
  | "cooloff"
  | "booked"
  | "replied";

export type ProspectPoolRow = {
  id: string;
  email: string;
  niche: SaasNiche;
  source_preset: string | null;
  company_name: string | null;
  status: ProspectPoolStatus;
  cooloff_until: string | null;
  tap_count: number;
  last_tap_at: string | null;
  assigned_client_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientOutreachSlot = {
  id: string;
  agence_id: string;
  niche_preferences: Record<SaasNiche, number>;
  inbox_allocation: number;
  capacity_status: CapacityStatus;
  rdv_goal_monthly: number;
  instantly_campaign_id: string | null;
  instantly_list_id: string | null;
  calendly_scheduling_url: string | null;
  queue_position: number | null;
  activated_at: string | null;
  estimated_activation_at: string | null;
  sends_this_month: number;
  sends_month_key: string | null;
  rdv_booked_this_month: number;
  rdv_month_key: string | null;
  created_at: string;
  updated_at: string;
};

export type InboxPoolRow = {
  id: string;
  email: string;
  instantly_account_id: string | null;
  client_slot_id: string | null;
  status: InboxStatus;
  warmup_started_at: string | null;
  daily_send_cap: number;
  created_at: string;
  updated_at: string;
};

export type InboxProvisionQueueRow = {
  id: string;
  client_slot_id: string;
  inboxes_requested: number;
  inboxes_provisioned: number;
  status: InboxQueueStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type LeadAssignment = {
  id: string;
  prospect_id: string;
  client_slot_id: string;
  assigned_at: string;
  sequence_state: SequenceState;
  tap1_sent_at: string | null;
  tap2_sent_at: string | null;
  instantly_lead_id: string | null;
  link_tracking_slug: string | null;
  booked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PoolRouterRunResult = {
  assigned: number;
  skipped: number;
  errors: number;
  details: Record<string, unknown>;
};

export type SequenceSchedulerResult = {
  tap2Queued: number;
  cooloffApplied: number;
  cooloffReleased: number;
  errors: number;
};

export type CapacitySlaSnapshot = {
  inboxAllocation: number;
  rdvGoalMonthly: number;
  phase: "warmup" | "active" | "paused" | "queued";
  estimatedActivationAt: string | null;
  rdvBookedThisMonth: number;
  sendsThisMonth: number;
  monthlySendBudget: number;
  progressPct: number;
};
