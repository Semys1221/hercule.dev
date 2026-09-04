/**
 * Rebalance agence leads on Mon/Tue/Wed meetings from main sequence to weekday recovery.
 *
 * Usage:
 *   pnpm rebalance-recovery-weekday [--dry-run] [--weekday=mon|tue|wed]
 */
import {
  cancelPendingJobsForLead,
} from "@/lib/booking-communication/jobs";
import { getBookingGoLiveAt, isLegacyAgenceLead } from "@/lib/booking-communication/legacy";
import { startRoleRecoverySequence } from "@/lib/booking-communication/orchestrator";
import {
  meetingWeekdayParis,
  planRecoveryByMeetingWeekday,
  type ParisWeekdayShort,
} from "@/lib/booking-communication/schedule";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import {
  createLinkTrackingClient,
} from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

const MAIN_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

const RECOVERY_TYPES: BookingEmailType[] = ["role_seq_48", "role_seq_24"];

type WeekdayFilter = "mon" | "tue" | "wed";

type Args = {
  dryRun: boolean;
  weekday?: WeekdayFilter;
};

type JobRow = {
  email_type: BookingEmailType;
  status: string;
  scheduled_for: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let weekday: WeekdayFilter | undefined;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg.startsWith("--weekday=")) {
      const value = arg.slice("--weekday=".length).trim().toLowerCase();
      if (value !== "mon" && value !== "tue" && value !== "wed") {
        throw new Error("--weekday must be mon, tue, or wed");
      }
      weekday = value;
    }
  }

  return { dryRun, weekday };
}

function weekdayMatchesFilter(
  parisWeekday: ParisWeekdayShort,
  filter?: WeekdayFilter,
): boolean {
  if (!filter) {
    return parisWeekday === "Mon" || parisWeekday === "Tue" || parisWeekday === "Wed";
  }
  const map: Record<WeekdayFilter, ParisWeekdayShort> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
  };
  return parisWeekday === map[filter];
}

async function listJobsForLead(leadId: string): Promise<JobRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("email_type, status, scheduled_for")
    .eq("lead_id", leadId);

  if (error) {
    throw new Error(`Failed to list jobs for ${leadId}: ${error.message}`);
  }

  return (data ?? []) as JobRow[];
}

function canRebalance(jobs: JobRow[]): { ok: true } | { ok: false; reason: string } {
  if (jobs.length === 0) {
    return { ok: true };
  }

  const sentImmediate = jobs.some(
    (job) => job.email_type === "immediate" && job.status === "sent",
  );
  if (sentImmediate) {
    return { ok: false, reason: "immediate_already_sent" };
  }

  const hasSent = jobs.some((job) => job.status === "sent");
  if (hasSent) {
    return { ok: false, reason: "other_email_already_sent" };
  }

  const hasMain = jobs.some((job) => MAIN_TYPES.includes(job.email_type));
  const hasRecovery = jobs.some((job) => RECOVERY_TYPES.includes(job.email_type));

  if (hasMain && !hasRecovery) {
    return { ok: true };
  }

  if (hasRecovery && !hasMain) {
    return { ok: true };
  }

  if (hasMain && hasRecovery) {
    return { ok: true };
  }

  return { ok: false, reason: "unexpected_job_mix" };
}

async function rebalanceLead(
  lead: LinkTrackingLead,
  dryRun: boolean,
): Promise<{ action: "rebalanced" | "skipped"; reason?: string }> {
  if (!lead.scheduled_at) {
    return { action: "skipped", reason: "missing_scheduled_at" };
  }

  const jobs = await listJobsForLead(lead.id);
  const eligibility = canRebalance(jobs);
  if (!eligibility.ok) {
    return { action: "skipped", reason: eligibility.reason };
  }

  const schedule = planRecoveryByMeetingWeekday(lead.scheduled_at);

  if (dryRun) {
    return { action: "rebalanced", reason: "dry_run" };
  }

  await cancelPendingJobsForLead(lead.id, [...MAIN_TYPES, ...RECOVERY_TYPES]);

  const result = await startRoleRecoverySequence({
    category: "agence",
    lead,
    triggeredBy: "role_recovery",
    partial: true,
    recoverySchedule: {
      roleSeq48: schedule.roleSeq48,
      roleSeq24: schedule.roleSeq24,
    },
  });

  if (!result.started) {
    return { action: "skipped", reason: result.reason ?? "start_failed" };
  }

  return { action: "rebalanced" };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = createLinkTrackingClient();
  const goLive = getBookingGoLiveAt();

  const { data, error } = await client
    .from("agence")
    .select("*")
    .eq("statut", "MEETING_BOOKED")
    .gte("booked_at", goLive.toISOString());

  if (error) {
    throw new Error(`Failed to list agence leads: ${error.message}`);
  }

  let rebalanced = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const lead = row as LinkTrackingLead;
    if (isLegacyAgenceLead("agence", lead)) {
      skipped += 1;
      continue;
    }
    if (!lead.scheduled_at) {
      skipped += 1;
      continue;
    }

    const parisWeekday = meetingWeekdayParis(lead.scheduled_at);
    if (!weekdayMatchesFilter(parisWeekday, args.weekday)) {
      continue;
    }

    const schedule = planRecoveryByMeetingWeekday(lead.scheduled_at);
    const outcome = await rebalanceLead(lead, args.dryRun);

    console.log(
      JSON.stringify({
        email: lead.email,
        lead_id: lead.id,
        scheduled_at: lead.scheduled_at,
        meeting_weekday: parisWeekday,
        variant: schedule.variant,
        role_seq_48: schedule.roleSeq48.toISOString(),
        role_seq_24: schedule.roleSeq24.toISOString(),
        dry_run: args.dryRun,
        ...outcome,
      }),
    );

    if (outcome.action === "rebalanced") {
      rebalanced += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      dry_run: args.dryRun,
      weekday_filter: args.weekday ?? "mon,tue,wed",
      rebalanced,
      skipped,
    }),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
