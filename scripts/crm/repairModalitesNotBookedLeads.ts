/**
 * Audit and repair leads with modalites_ask sent but statut still NOTBOOKED/CLICKED.
 *
 * Usage:
 *   pnpm audit-modalites-not-booked
 *   pnpm repair-modalites-not-booked
 *   pnpm repair-modalites-not-booked -- --execute
 *   pnpm repair-modalites-not-booked -- --email=contact@compta-nova.fr --execute
 */
import { syncLeadMeetingBookedToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  markInstantlySynced,
  markLeadBooked,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";
import { isMeetingBookedStatus } from "@/lib/link-tracking/types";

type AffectedLead = {
  category: LeadCategory;
  lead: LinkTrackingLead;
  askStatus: string;
};

type Args = {
  email?: string;
  dryRun: boolean;
  auditOnly: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let email: string | undefined;
  let dryRun = true;
  let execute = false;
  let auditOnly = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--execute") execute = true;
    else if (arg === "--audit") auditOnly = true;
    else if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length).trim().toLowerCase();
    }
  }

  if (execute) {
    dryRun = false;
  }

  return { email, dryRun, auditOnly };
}

async function listAffectedLeads(emailFilter?: string): Promise<AffectedLead[]> {
  const client = createLinkTrackingClient();
  const { data: askJobs, error: jobsErr } = await client
    .from("booking_email_jobs")
    .select("lead_id, lead_category, status")
    .eq("email_type", "modalites_ask")
    .in("status", ["sent", "pending"]);

  if (jobsErr) {
    throw new Error(jobsErr.message);
  }

  const byLead = new Map<string, { category: LeadCategory; askStatus: string }>();
  for (const job of askJobs ?? []) {
    const category = job.lead_category as LeadCategory;
    if (category !== "agence" && category !== "comptable" && category !== "entreprise") {
      continue;
    }
    byLead.set(`${job.lead_id}:${category}`, {
      category,
      askStatus: job.status,
    });
  }

  const affected: AffectedLead[] = [];
  for (const [key, meta] of byLead) {
    const leadId = key.split(":")[0]!;
    const { data: lead, error } = await client
      .from(meta.category)
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (error || !lead) {
      continue;
    }
    if (lead.statut === "CONFIRMED" || lead.statut === "CANCELLED") {
      continue;
    }
    if (isMeetingBookedStatus(lead.statut)) {
      continue;
    }
    if (emailFilter && lead.email !== emailFilter) {
      continue;
    }

    affected.push({
      category: meta.category,
      lead: lead as LinkTrackingLead,
      askStatus: meta.askStatus,
    });
  }

  affected.sort((a, b) =>
    (a.lead.scheduled_at ?? "").localeCompare(b.lead.scheduled_at ?? ""),
  );
  return affected;
}

async function repairLead(entry: AffectedLead, dryRun: boolean): Promise<void> {
  const { category, lead } = entry;
  console.log(
    `${dryRun ? "[dry-run]" : "[execute]"} ${lead.email} (${category}) ` +
      `${lead.statut} → MEETING_BOOKED, RDV ${lead.scheduled_at ?? "?"}`,
  );

  if (dryRun) {
    return;
  }

  const client = createLinkTrackingClient();
  const result = await markLeadBooked(client, {
    slug: lead.slug,
    email: lead.email,
    calendlyInviteeUri: lead.calendly_invitee_uri ?? "",
    scheduledAt: lead.scheduled_at,
    calendlyPayload: lead.calendly_payload,
    firstName: lead.first_name,
    company: lead.company,
  });

  if (!result.lookup) {
    throw new Error(`markLeadBooked failed for ${lead.email}: ${result.reason}`);
  }
  if (!isMeetingBookedStatus(result.lookup.lead.statut)) {
    throw new Error(
      `Expected MEETING_BOOKED for ${lead.email}, got ${result.lookup.lead.statut} (${result.reason})`,
    );
  }

  if (!result.lookup.lead.instantly_synced_at) {
    try {
      await syncLeadMeetingBookedToInstantly(result.lookup.lead, category);
      await markInstantlySynced(client, category, result.lookup.lead.id);
    } catch (err) {
      console.warn(
        `[repair] Instantly sync failed for ${lead.email}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`OK repaired ${lead.email} → MEETING_BOOKED`);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const affected = await listAffectedLeads(args.email);

  console.log(`Found ${affected.length} lead(s) with modalites sent but not MEETING_BOOKED`);
  for (const entry of affected) {
    console.log(
      `  - ${entry.lead.email} (${entry.category}, ${entry.lead.statut}, ask=${entry.askStatus})`,
    );
  }

  if (args.auditOnly || affected.length === 0) {
    return;
  }

  for (const entry of affected) {
    await repairLead(entry, args.dryRun);
  }

  if (args.dryRun) {
    console.log("Dry run complete. Re-run with --execute to apply repairs.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
