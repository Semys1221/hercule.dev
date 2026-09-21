/**
 * Repair split-booking leads: same Instantly lead, booking on a sibling email.
 *
 * Usage:
 *   pnpm audit-split-booking-leads
 *   pnpm repair-split-booking-leads
 *   pnpm repair-split-booking-leads -- --execute
 *   pnpm repair-split-booking-leads -- --email=contact@scpiselect.fr --execute
 */
import {
  findSplitBookingPairs,
  repairSplitBookingPair,
} from "@/lib/link-tracking/split-booking";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

type Args = {
  email?: string;
  dryRun: boolean;
  auditOnly: boolean;
  category: LeadCategory;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let email: string | undefined;
  let dryRun = true;
  let execute = false;
  let auditOnly = false;
  let category: LeadCategory = "cif";

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--execute") execute = true;
    else if (arg === "--audit") auditOnly = true;
    else if (arg.startsWith("--email=")) {
      email = arg.slice("--email=".length).trim().toLowerCase();
    } else if (arg.startsWith("--category=")) {
      category = arg.slice("--category=".length).trim() as LeadCategory;
    }
  }

  if (execute) {
    dryRun = false;
  }

  return { email, dryRun, auditOnly, category };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = createLinkTrackingClient();
  const pairs = await findSplitBookingPairs(client, args.category);
  const filtered = args.email
    ? pairs.filter(
        (pair) =>
          pair.campaignEmail.email === args.email ||
          pair.bookedEmail.email === args.email,
      )
    : pairs;

  console.log(`Found ${filtered.length} split-booking pair(s) in ${args.category}`);
  for (const pair of filtered) {
    console.log(
      `  - campaign=${pair.campaignEmail.email} (${pair.campaignEmail.statut}) ` +
        `booked=${pair.bookedEmail.email} (${pair.bookedEmail.statut}) ` +
        `instantly=${pair.instantlyLeadId}`,
    );
  }

  if (args.auditOnly || filtered.length === 0) {
    return;
  }

  for (const pair of filtered) {
    const result = await repairSplitBookingPair(pair, {
      dryRun: args.dryRun,
      campaignEmailHint: pair.campaignEmail.email,
    });
    const prefix = args.dryRun ? "[dry-run]" : "[execute]";
    console.log(
      `${prefix} ${result.campaignEmail} ← ${result.bookedEmail} ` +
        `(sync=${result.instantlySynced}, sales_calls=${result.salesCallsMoved}, ` +
        `deleted=${result.duplicateDeleted}, reason=${result.reason ?? "ok"})`,
    );
  }

  if (args.dryRun) {
    console.log("Dry run complete. Re-run with --execute to apply repairs.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
