/**
 * Repair leads stuck at CONFIRMED without a successful booking email
 * (caused by reservation.html calling /api/link-tracking/confirm on Calendly book).
 *
 * Usage:
 *   pnpm repair-confirmed-without-booking-email
 *   pnpm repair-confirmed-without-booking-email -- --email=user@example.com
 *   pnpm repair-confirmed-without-booking-email -- --dry-run
 */
import { startBookingSequence } from "@/lib/booking-communication/orchestrator";
import {
  createLinkTrackingClient,
  findLeadByEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

type Args = {
  email?: string;
  dryRun: boolean;
};

type JobSummary = {
  total: number;
  sentImmediate: boolean;
  failedImmediate: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let email: string | undefined;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length).trim().toLowerCase();
    }
  }

  return { email, dryRun };
}

async function summarizeJobs(
  client: ReturnType<typeof createLinkTrackingClient>,
  leadId: string,
): Promise<JobSummary> {
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("email_type, status")
    .eq("lead_id", leadId);

  if (error) {
    throw new Error(`Failed to list jobs for ${leadId}: ${error.message}`);
  }

  const jobs = data ?? [];
  return {
    total: jobs.length,
    sentImmediate: jobs.some(
      (job) => job.email_type === "immediate" && job.status === "sent",
    ),
    failedImmediate: jobs.some(
      (job) => job.email_type === "immediate" && job.status === "failed",
    ),
  };
}

async function needsRepair(
  client: ReturnType<typeof createLinkTrackingClient>,
  lead: LinkTrackingLead,
): Promise<boolean> {
  if (lead.statut !== "CONFIRMED") return false;

  const jobs = await summarizeJobs(client, lead.id);
  return !jobs.sentImmediate;
}

async function listAffectedLeads(
  client: ReturnType<typeof createLinkTrackingClient>,
  email?: string,
): Promise<Array<{ category: LeadCategory; lead: LinkTrackingLead }>> {
  const affected: Array<{ category: LeadCategory; lead: LinkTrackingLead }> = [];

  for (const category of ["agence", "entreprise"] as const) {
    let query = client.from(category).select("*").eq("statut", "CONFIRMED");

    if (email) {
      query = query.eq("email", email);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list ${category} leads: ${error.message}`);
    }

    for (const row of data ?? []) {
      const lead = row as LinkTrackingLead;
      if (await needsRepair(client, lead)) {
        affected.push({ category, lead });
      }
    }
  }

  return affected;
}

async function repairLead(
  client: ReturnType<typeof createLinkTrackingClient>,
  category: LeadCategory,
  lead: LinkTrackingLead,
  dryRun: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const jobs = await summarizeJobs(client, lead.id);

  if (dryRun) {
    console.log(
      `[dry-run] Would repair ${category}/${lead.email} (${lead.id}): delete ${jobs.total} job(s), CONFIRMED → MEETING_BOOKED, restart sequence`,
    );
    return;
  }

  const { error: deleteError } = await client
    .from("booking_email_jobs")
    .delete()
    .eq("lead_id", lead.id);

  if (deleteError) {
    throw new Error(`Failed to delete jobs for ${lead.id}: ${deleteError.message}`);
  }

  const { data, error } = await client
    .from(category)
    .update({
      statut: "MEETING_BOOKED",
      booked_at: lead.booked_at ?? now,
      confirmed_at: null,
      instantly_confirmed_synced_at: null,
    })
    .eq("id", lead.id)
    .eq("statut", "CONFIRMED")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update ${lead.id}: ${error.message}`);
  }
  if (!data) {
    console.warn(`Skipped ${lead.email}: statut changed since scan`);
    return;
  }

  const repaired = data as LinkTrackingLead;
  const seq = await startBookingSequence({
    category,
    lead: repaired,
    triggeredBy: "manual",
  });

  console.log(
    `Repaired ${category}/${repaired.email}: MEETING_BOOKED, sequence=${seq.started}${seq.reason ? ` (${seq.reason})` : ""}`,
  );
}

async function main(): Promise<void> {
  const { email, dryRun } = parseArgs();
  const client = createLinkTrackingClient();

  const affected = await listAffectedLeads(client, email);
  if (affected.length === 0) {
    console.log(
      "No affected leads (CONFIRMED without a sent immediate booking email).",
    );
    return;
  }

  console.log(`Found ${affected.length} affected lead(s).`);
  for (const item of affected) {
    await repairLead(client, item.category, item.lead, dryRun);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
