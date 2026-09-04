/**
 * Smoke test: partial booking sequence inserts only requested email jobs.
 *
 * Usage: pnpm smoke-booking-partial-trigger
 * Optional: SMOKE_BOOKING_EMAIL=... (defaults to first MEETING_BOOKED agence lead)
 */
import { startBookingSequence } from "@/lib/booking-communication/orchestrator";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

async function findSmokeLead(): Promise<LinkTrackingLead | null> {
  const email = process.env.SMOKE_BOOKING_EMAIL?.trim().toLowerCase();
  const client = createLinkTrackingClient();

  if (email) {
    const { data, error } = await client
      .from("agence")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return (data as LinkTrackingLead | null) ?? null;
  }

  const { data, error } = await client
    .from("agence")
    .select("*")
    .eq("statut", "MEETING_BOOKED")
    .not("scheduled_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return (data as LinkTrackingLead | null) ?? null;
}

async function countJobs(leadId: string, emailType: string): Promise<number> {
  const client = createLinkTrackingClient();
  const { count, error } = await client
    .from("booking_email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("email_type", emailType);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function main(): Promise<void> {
  const lead = await findSmokeLead();
  if (!lead?.scheduled_at) {
    console.log(
      "SKIP partial trigger smoke: no MEETING_BOOKED agence lead with scheduled_at",
    );
    return;
  }

  const beforeImmediate = await countJobs(lead.id, "immediate");
  const beforeH48 = await countJobs(lead.id, "h48_confirm");

  const result = await startBookingSequence({
    category: "agence",
    lead,
    triggeredBy: "manual",
    emailTypes: ["h48_confirm"],
    partial: true,
  });

  if (!result.started && result.reason === "no_jobs_inserted" && beforeH48 > 0) {
    console.log("OK partial trigger: h48 job already exists (idempotent)");
    return;
  }

  if (!result.started) {
    throw new Error(`partial start failed: ${result.reason ?? "unknown"}`);
  }

  const afterImmediate = await countJobs(lead.id, "immediate");
  const afterH48 = await countJobs(lead.id, "h48_confirm");

  if (afterImmediate !== beforeImmediate) {
    throw new Error("partial h48 trigger must not insert immediate job");
  }
  if (afterH48 < beforeH48 + 1 && beforeH48 === 0) {
    throw new Error("expected h48_confirm job to be inserted");
  }

  console.log("partial booking trigger smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
