/**
 * Repair post-go-live agence bookings that have no booking_email_jobs.
 *
 * Usage:
 *   pnpm repair-missing-booking-sequences
 *   pnpm repair-missing-booking-sequences -- --dry-run
 *   pnpm repair-missing-booking-sequences -- --execute
 *   pnpm repair-missing-booking-sequences -- --email=user@example.com --execute
 */
import { isLegacyAgenceLead } from "@/lib/booking-communication/legacy";
import {
  h20SendAt,
  h24SendAt,
  h48SendAt,
  planRecoveryByMeetingWeekday,
} from "@/lib/booking-communication/schedule";
import {
  sequenceKindForMeeting,
  startSequenceForBookedLead,
} from "@/lib/booking-communication/route-sequence";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { formatParisSlot } from "@/lib/booking-communication/send-window";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

const REMINDER_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
];

type Args = {
  email?: string;
  dryRun: boolean;
};

type PlannedJob = {
  emailType: BookingEmailType;
  scheduledFor: Date;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let email: string | undefined;
  let dryRun = true;
  let execute = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--execute") execute = true;
    else if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length).trim().toLowerCase();
    }
  }

  if (execute) {
    dryRun = false;
  }

  return { email, dryRun };
}

function planJobsForLead(
  lead: LinkTrackingLead,
): { sequence: "main" | "recovery"; jobs: PlannedJob[] } | { skip: string } {
  if (!lead.scheduled_at?.trim()) {
    return { skip: "missing_scheduled_at" };
  }

  const meetingAt = new Date(lead.scheduled_at);
  if (Number.isNaN(meetingAt.getTime())) {
    return { skip: "invalid_scheduled_at" };
  }

  if (meetingAt.getTime() <= Date.now()) {
    return { skip: "meeting_already_passed" };
  }

  const kind = sequenceKindForMeeting(lead.scheduled_at, "agence");
  if (kind === "none") {
    return { skip: "missing_scheduled_at" };
  }

  if (kind === "recovery") {
    const schedule = planRecoveryByMeetingWeekday(lead.scheduled_at);
    return {
      sequence: "recovery",
      jobs: [
        { emailType: "role_seq_48", scheduledFor: schedule.roleSeq48 },
        { emailType: "role_seq_24", scheduledFor: schedule.roleSeq24 },
      ],
    };
  }

  return {
    sequence: "main",
    jobs: [
      { emailType: "immediate", scheduledFor: new Date() },
      { emailType: "h48_confirm", scheduledFor: h48SendAt(lead.scheduled_at) },
      { emailType: "h24_relance", scheduledFor: h24SendAt(lead.scheduled_at) },
      { emailType: "h20_cancel", scheduledFor: h20SendAt(lead.scheduled_at) },
    ],
  };
}

async function hasReminderJobs(
  client: ReturnType<typeof createLinkTrackingClient>,
  leadId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id")
    .eq("lead_id", leadId)
    .in("email_type", REMINDER_TYPES)
    .limit(1);

  if (error) {
    throw new Error(`Failed to check jobs for ${leadId}: ${error.message}`);
  }

  return Boolean(data?.length);
}

async function listAffectedLeads(
  client: ReturnType<typeof createLinkTrackingClient>,
  email?: string,
): Promise<LinkTrackingLead[]> {
  let query = client
    .from("agence")
    .select("*")
    .eq("statut", "MEETING_BOOKED")
    .not("scheduled_at", "is", null);

  if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list agence leads: ${error.message}`);
  }

  const leads = (data ?? []) as LinkTrackingLead[];
  const affected: LinkTrackingLead[] = [];

  for (const lead of leads) {
    if (isLegacyAgenceLead("agence", lead)) {
      continue;
    }
    const hasJobs = await hasReminderJobs(client, lead.id);
    if (!hasJobs) {
      affected.push(lead);
    }
  }

  return affected;
}

async function main() {
  const { email, dryRun } = parseArgs();
  const client = createLinkTrackingClient();
  const leads = await listAffectedLeads(client, email);

  if (leads.length === 0) {
    console.log("No post-go-live agence bookings missing reminder jobs.");
    return;
  }

  console.log(
    `${dryRun ? "[dry-run]" : "[execute]"} ${leads.length} lead(s) missing reminder jobs`,
  );

  for (const lead of leads) {
    const plan = planJobsForLead(lead);
    console.log(`\n${lead.email} (${lead.slug})`);
    console.log(`  meeting: ${formatParisSlot(new Date(lead.scheduled_at!))}`);

    if ("skip" in plan) {
      console.log(`  skip: ${plan.skip}`);
      continue;
    }

    console.log(`  sequence: ${plan.sequence}`);
    for (const job of plan.jobs) {
      console.log(
        `  - ${job.emailType}: ${formatParisSlot(job.scheduledFor)}`,
      );
    }

    if (dryRun) {
      console.log("  action: would start sequence");
      continue;
    }

    const result = await startSequenceForBookedLead({
      category: "agence",
      lead,
      triggeredBy: "retry",
    });
    console.log(`  result: ${result.started ? "started" : result.reason}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
