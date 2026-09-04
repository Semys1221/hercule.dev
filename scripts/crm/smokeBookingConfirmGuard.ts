/**
 * Smoke checks for booking vs confirm flow after CONFIRMED skip fix.
 *
 * Usage: pnpm smoke-booking-confirm-guard
 */
import fs from "node:fs";
import path from "node:path";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { isMeetingBookedStatus } from "@/lib/link-tracking/types";

const ROOT = process.cwd();

function assertNoConfirmOnBookingPages(): void {
  for (const file of ["public/reservation.html", "public/reservation-entreprise.html"]) {
    const content = fs.readFileSync(path.join(ROOT, file), "utf8");
    if (content.includes("/api/link-tracking/confirm")) {
      throw new Error(`${file} must not call /api/link-tracking/confirm on Calendly book`);
    }
  }

  const confirmPage = fs.readFileSync(
    path.join(ROOT, "public/confirm-reservation.html"),
    "utf8",
  );
  if (!confirmPage.includes("/api/link-tracking/confirm")) {
    throw new Error("confirm-reservation.html must call /api/link-tracking/confirm");
  }

  console.log("OK static: booking pages do not call confirm API");
}

async function assertConfirmGuardLive(): Promise<void> {
  const baseUrl =
    process.env.CRM_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence")
    .select("slug, email")
    .eq("statut", "NOTBOOKED")
    .limit(1)
    .maybeSingle();

  if (error || !data?.slug) {
    console.log("SKIP live confirm guard: no NOTBOOKED agence lead in Supabase");
    return;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/link-tracking/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: data.slug, email: data.email }),
  });

  const body = (await response.json()) as { reason?: string };
  if (response.status !== 409 || body.reason !== "not_booked_yet") {
    throw new Error(
      `Expected 409 not_booked_yet for NOTBOOKED lead, got ${response.status} ${JSON.stringify(body)}`,
    );
  }

  console.log("OK live: confirm API rejects NOTBOOKED lead with not_booked_yet");
}

async function assertBookedCanConfirm(): Promise<void> {
  if (!isMeetingBookedStatus("MEETING_BOOKED")) {
    throw new Error("isMeetingBookedStatus helper broken");
  }
  console.log("OK unit: isMeetingBookedStatus accepts MEETING_BOOKED");
}

async function assertRepairedLeadHasSentImmediate(): Promise<void> {
  const client = createLinkTrackingClient();
  const email = process.env.SMOKE_BOOKING_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("SKIP repaired lead check: set SMOKE_BOOKING_EMAIL to verify a booking");
    return;
  }

  const lookup = await client.from("agence").select("*").eq("email", email).maybeSingle();
  const lead = lookup.data;
  if (!lead) {
    throw new Error(`Smoke booking email not found: ${email}`);
  }
  if (lead.statut !== "MEETING_BOOKED") {
    throw new Error(`Expected MEETING_BOOKED for ${email}, got ${lead.statut}`);
  }

  const { data: jobs, error } = await client
    .from("booking_email_jobs")
    .select("email_type, status, resend_email_id")
    .eq("lead_id", lead.id)
    .eq("email_type", "immediate")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const immediate = jobs?.[0];
  if (!immediate || immediate.status !== "sent" || !immediate.resend_email_id) {
    throw new Error(
      `Expected sent immediate job for ${email}, got ${JSON.stringify(immediate)}`,
    );
  }

  console.log(`OK data: ${email} is MEETING_BOOKED with sent immediate Resend job`);
}

async function main(): Promise<void> {
  assertNoConfirmOnBookingPages();
  await assertBookedCanConfirm();
  await assertConfirmGuardLive();
  await assertRepairedLeadHasSentImmediate();
  console.log("All smoke checks passed.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
