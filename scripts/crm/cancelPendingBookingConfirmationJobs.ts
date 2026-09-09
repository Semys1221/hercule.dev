/**
 * Cancel pending booking confirmation / auto-cancel jobs without touching Calendly or lead statuts.
 *
 * Usage:
 *   pnpm cancel-pending-booking-confirmation-jobs
 *   pnpm cancel-pending-booking-confirmation-jobs -- --execute
 */
import { DISABLED_MEETING_CONFIRMATION_TYPES } from "@/lib/booking-communication/confirmation-disabled";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

type Args = {
  execute: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  return { execute: argv.includes("--execute") };
}

async function main(): Promise<void> {
  const { execute } = parseArgs();
  const client = createLinkTrackingClient();
  const emailTypes = [...DISABLED_MEETING_CONFIRMATION_TYPES];

  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id, email_type, lead_id, scheduled_for")
    .eq("status", "pending")
    .in("email_type", emailTypes)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(`Failed to list pending jobs: ${error.message}`);
  }

  const jobs = data ?? [];
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const type = String(job.email_type);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  console.log(
    `${execute ? "EXECUTE" : "DRY-RUN"}: ${jobs.length} pending job(s) to cancel`,
  );
  for (const type of emailTypes) {
    const count = counts.get(type) ?? 0;
    if (count > 0) {
      console.log(`  ${type}: ${count}`);
    }
  }

  if (jobs.length === 0) {
    console.log("Nothing to cancel.");
    return;
  }

  if (!execute) {
    console.log("Re-run with --execute to cancel these jobs.");
    return;
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await client
    .from("booking_email_jobs")
    .update({
      status: "cancelled",
      cancelled_at: now,
    })
    .eq("status", "pending")
    .in("email_type", emailTypes)
    .select("id");

  if (updateError) {
    throw new Error(`Failed to cancel jobs: ${updateError.message}`);
  }

  console.log(`Cancelled ${updated?.length ?? 0} job(s).`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
