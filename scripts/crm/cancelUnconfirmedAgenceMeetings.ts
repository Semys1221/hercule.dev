/**
 * Cancel future Calendly meetings for agence leads that have not confirmed attendance.
 *
 * Usage:
 *   pnpm cancel-unconfirmed-agence-meetings
 *   pnpm cancel-unconfirmed-agence-meetings -- --dry-run
 *   pnpm cancel-unconfirmed-agence-meetings -- --email=contact@chef-et-dev.fr
 */
import { enforceModalitesCancelForLead } from "@/lib/modalites-campaign/enforce-cancel";
import { loadLeadLookup } from "@/lib/modalites-campaign/provision";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { isMeetingBookedStatus } from "@/lib/link-tracking/types";

const CANCEL_REASON =
  "Annulation manuelle — absence de confirmation de présence.";

type Args = {
  email?: string;
  dryRun: boolean;
};

type ResultCounts = {
  cancelled: number;
  skipped_confirmed: number;
  skipped_already_cancelled: number;
  skipped_no_calendly: number;
  errors: number;
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

function isDevSeed(email: string): boolean {
  return email.endsWith("@example.com");
}

async function listTargetLeads(
  email?: string,
): Promise<LinkTrackingLead[]> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();

  let query = client
    .from("agence")
    .select("*")
    .in("statut", ["MEETING_BOOKED", "BOOKED"])
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });

  if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list agence leads: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row as LinkTrackingLead)
    .filter((lead) => !isDevSeed(lead.email));
}

function formatScheduledAt(scheduledAt: string | null): string {
  if (!scheduledAt) return "—";
  return new Date(scheduledAt).toISOString().replace("T", " ").slice(0, 16);
}

async function cancelLead(
  lead: LinkTrackingLead,
  dryRun: boolean,
): Promise<keyof ResultCounts> {
  if (!isMeetingBookedStatus(lead.statut)) {
    if (lead.statut === "CONFIRMED") return "skipped_confirmed";
    if (lead.statut === "CANCELLED") return "skipped_already_cancelled";
  }

  if (!lead.calendly_invitee_uri) {
    console.warn(
      `  skip ${lead.email}: no calendly_invitee_uri (scheduled ${formatScheduledAt(lead.scheduled_at)})`,
    );
    return "skipped_no_calendly";
  }

  if (dryRun) {
    console.log(
      `  [dry-run] would cancel ${lead.email} (RDV ${formatScheduledAt(lead.scheduled_at)} UTC)`,
    );
    return "cancelled";
  }

  const lookup = await loadLeadLookup("agence", lead.id);
  if (!lookup) {
    console.error(`  error ${lead.email}: lead not found`);
    return "errors";
  }

  try {
    const result = await enforceModalitesCancelForLead(lookup, CANCEL_REASON);
    console.log(
      `  ${result} ${lead.email} (RDV ${formatScheduledAt(lead.scheduled_at)} UTC)`,
    );
    if (result === "cancelled") return "cancelled";
    if (result === "skipped_confirmed") return "skipped_confirmed";
    return "skipped_already_cancelled";
  } catch (err) {
    console.error(
      `  error ${lead.email}: ${err instanceof Error ? err.message : err}`,
    );
    return "errors";
  }
}

async function main(): Promise<void> {
  const { email, dryRun } = parseArgs();
  const leads = await listTargetLeads(email);

  if (leads.length === 0) {
    console.log("No unconfirmed agence leads with future meetings found.");
    return;
  }

  console.log(
    `Found ${leads.length} unconfirmed agence lead(s) with future meetings${dryRun ? " (dry-run)" : ""}.`,
  );

  const counts: ResultCounts = {
    cancelled: 0,
    skipped_confirmed: 0,
    skipped_already_cancelled: 0,
    skipped_no_calendly: 0,
    errors: 0,
  };

  for (const lead of leads) {
    const outcome = await cancelLead(lead, dryRun);
    counts[outcome]++;
  }

  console.log("\nSummary:");
  console.log(`  cancelled: ${counts.cancelled}`);
  console.log(`  skipped_confirmed: ${counts.skipped_confirmed}`);
  console.log(`  skipped_already_cancelled: ${counts.skipped_already_cancelled}`);
  console.log(`  skipped_no_calendly: ${counts.skipped_no_calendly}`);
  console.log(`  errors: ${counts.errors}`);

  if (counts.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
