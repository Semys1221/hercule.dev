/**
 * Migrate modalités jobs from meeting-relative H-3/H-1 to fixed T+23h / T+24h
 * from modalites_ask sent (or scheduled) time.
 *
 * Usage:
 *   pnpm overwrite-modalites-24h
 *   pnpm overwrite-modalites-24h -- --execute
 *   pnpm overwrite-modalites-24h -- --lead-id=uuid --execute
 */
import {
  cancelJob,
  markJobSent,
  rescheduleJob,
} from "@/lib/booking-communication/jobs";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { enforceModalitesCancelForLead } from "@/lib/modalites-campaign/enforce-cancel";
import { loadLeadLookup } from "@/lib/modalites-campaign/provision";
import {
  MODALITES_ENFORCE_AFTER_MS,
  modalitesEnforceCancelAtFromAskSent,
  modalitesWarningAtFromAskSent,
} from "@/lib/modalites-campaign/schedule";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

const MODALITES_TYPES: BookingEmailType[] = [
  "modalites_ask",
  "modalites_cancel",
  "modalites_enforce_cancel",
];

type JobRow = {
  id: string;
  lead_id: string;
  lead_category: LeadCategory;
  email_type: BookingEmailType;
  status: "pending" | "sent" | "cancelled" | "failed";
  scheduled_for: string;
  sent_at: string | null;
};

type LeadAction = {
  leadId: string;
  category: LeadCategory;
  statut: string | null;
  askStatus: string | null;
  actions: string[];
  overdue: boolean;
};

type Args = {
  leadId?: string;
  dryRun: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let leadId: string | undefined;
  let dryRun = true;
  let execute = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--execute") execute = true;
    else if (arg.startsWith("--lead-id=")) {
      leadId = arg.slice("--lead-id=".length).trim();
    }
  }

  if (execute) {
    dryRun = false;
  }

  return { leadId, dryRun };
}

async function loadModalitesJobs(leadId?: string): Promise<JobRow[]> {
  const client = createLinkTrackingClient();
  let query = client
    .from("booking_email_jobs")
    .select(
      "id, lead_id, lead_category, email_type, status, scheduled_for, sent_at",
    )
    .in("email_type", MODALITES_TYPES)
    .in("status", ["pending", "sent"]);

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load modalités jobs: ${error.message}`);
  }

  return (data ?? []) as JobRow[];
}

function groupJobsByLead(jobs: JobRow[]): Map<string, JobRow[]> {
  const map = new Map<string, JobRow[]>();
  for (const job of jobs) {
    const list = map.get(job.lead_id) ?? [];
    list.push(job);
    map.set(job.lead_id, list);
  }
  return map;
}

function findJob(
  jobs: JobRow[],
  emailType: BookingEmailType,
): JobRow | undefined {
  return jobs.find((job) => job.email_type === emailType);
}

function askAnchorAt(ask: JobRow | undefined, now: Date): Date | null {
  if (!ask) {
    return null;
  }
  if (ask.status === "sent" && ask.sent_at) {
    return new Date(ask.sent_at);
  }
  if (ask.status === "pending") {
    const scheduled = new Date(ask.scheduled_for);
    return new Date(Math.max(scheduled.getTime(), now.getTime()));
  }
  return null;
}

function isOverdue(anchor: Date, now: Date): boolean {
  return now.getTime() >= anchor.getTime() + MODALITES_ENFORCE_AFTER_MS;
}

async function planLeadAction(
  jobs: JobRow[],
  now: Date,
): Promise<LeadAction | null> {
  const ask = findJob(jobs, "modalites_ask");
  const cancel = findJob(jobs, "modalites_cancel");
  const enforce = findJob(jobs, "modalites_enforce_cancel");
  const category = (ask ?? cancel ?? enforce)?.lead_category;
  const leadId = (ask ?? cancel ?? enforce)?.lead_id;

  if (!category || !leadId) {
    return null;
  }

  const lookup = await loadLeadLookup(category, leadId);
  const statut = lookup?.lead.statut ?? null;
  const actions: string[] = [];

  if (!ask) {
    if (cancel?.status === "pending") {
      actions.push("cancel_orphan:modalites_cancel");
    }
    if (enforce?.status === "pending") {
      actions.push("cancel_orphan:modalites_enforce_cancel");
    }
    if (actions.length === 0) {
      return null;
    }
    return {
      leadId,
      category,
      statut,
      askStatus: null,
      actions,
      overdue: false,
    };
  }

  const anchor = askAnchorAt(ask, now);
  if (!anchor) {
    return null;
  }

  const warningAt = modalitesWarningAtFromAskSent(anchor, now);
  const enforceAt = modalitesEnforceCancelAtFromAskSent(anchor, now);
  const overdue =
    isOverdue(anchor, now) &&
    statut !== "CONFIRMED" &&
    statut !== "CANCELLED";

  if (overdue) {
    actions.push("enforce_cancel_now");
    if (cancel?.status === "pending") {
      actions.push("cancel_pending:modalites_cancel");
    }
    if (enforce?.status === "pending") {
      actions.push("mark_enforce_sent_after_cancel");
    }
    return {
      leadId,
      category,
      statut,
      askStatus: ask.status,
      actions,
      overdue: true,
    };
  }

  if (cancel?.status === "pending") {
    actions.push(
      `reschedule:modalites_cancel:${cancel.scheduled_for}->${warningAt.toISOString()}`,
    );
  }
  if (enforce?.status === "pending") {
    actions.push(
      `reschedule:modalites_enforce_cancel:${enforce.scheduled_for}->${enforceAt.toISOString()}`,
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return {
    leadId,
    category,
    statut,
    askStatus: ask.status,
    actions,
    overdue: false,
  };
}

async function executeLeadAction(
  jobs: JobRow[],
  plan: LeadAction,
  now: Date,
): Promise<void> {
  const cancel = findJob(jobs, "modalites_cancel");
  const enforce = findJob(jobs, "modalites_enforce_cancel");
  const ask = findJob(jobs, "modalites_ask");

  for (const action of plan.actions) {
    if (action === "cancel_orphan:modalites_cancel" && cancel) {
      await cancelJob(cancel.id);
    } else if (action === "cancel_orphan:modalites_enforce_cancel" && enforce) {
      await cancelJob(enforce.id);
    }
  }

  if (plan.overdue) {
    const lookup = await loadLeadLookup(plan.category, plan.leadId);
    if (!lookup) {
      throw new Error(`lead_not_found:${plan.leadId}`);
    }
    if (cancel?.status === "pending") {
      await cancelJob(cancel.id);
    }
    const result = await enforceModalitesCancelForLead(lookup);
    if (enforce?.status === "pending") {
      await markJobSent(enforce.id, `modalites-enforce-overwrite/${enforce.id}`);
    }
    console.log(`  enforce result: ${result}`);
    return;
  }

  const anchor = askAnchorAt(ask, now);
  if (!anchor) {
    return;
  }

  if (cancel?.status === "pending") {
    await rescheduleJob(
      cancel.id,
      modalitesWarningAtFromAskSent(anchor, now),
    );
  }
  if (enforce?.status === "pending") {
    await rescheduleJob(
      enforce.id,
      modalitesEnforceCancelAtFromAskSent(anchor, now),
    );
  }
}

async function main() {
  const { leadId, dryRun } = parseArgs();
  const now = new Date();
  const jobs = await loadModalitesJobs(leadId);
  const grouped = groupJobsByLead(jobs);

  console.log(
    `${dryRun ? "[dry-run]" : "[execute]"} modalités 24h overwrite — ${grouped.size} lead(s) with active jobs`,
  );

  let changed = 0;
  for (const [, leadJobs] of grouped) {
    const plan = await planLeadAction(leadJobs, now);
    if (!plan) {
      continue;
    }

    changed += 1;
    console.log(`\nlead ${plan.leadId} (${plan.category}, statut=${plan.statut ?? "?"})`);
    console.log(`  ask: ${plan.askStatus ?? "missing"}`);
    for (const action of plan.actions) {
      console.log(`  - ${action}`);
    }

    if (!dryRun) {
      await executeLeadAction(leadJobs, plan, now);
    }
  }

  if (changed === 0) {
    console.log("\nNo modalités jobs to migrate.");
  } else {
    console.log(`\n${changed} lead(s) ${dryRun ? "would be" : "were"} updated.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
