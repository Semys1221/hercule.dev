/**
 * Smoke: comptable acquisition 1 489 € post-payment sequence (fake lead).
 *
 * Usage:
 *   pnpm smoke-comptable-acquisition-e2e --dry-run
 *   pnpm smoke-comptable-acquisition-e2e --execute
 *   pnpm smoke-comptable-acquisition-e2e --execute --keep
 *   pnpm smoke-comptable-acquisition-e2e --execute --no-email
 *
 * Optional env:
 *   TEST_LEAD_EMAIL   inbox for welcome email (default onboarding@resend.dev)
 */

import assert from "node:assert/strict";

import {
  getEmailSequence,
  BOOKING_SEQUENCE_SLUGS,
} from "@/lib/legacy/admin/email-sequences/registry";
import {
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "@/lib/legacy/booking-communication/template-store";
import { ensureComptableAcquisitionLead } from "@/lib/legacy/comptable-acquisition/provision-lead";
import { startComptableAcquisitionSequence } from "@/lib/legacy/comptable-acquisition-sequence/orchestrator";
import {
  acquisitionRdvRangeLabel,
  formatEstimatedFirstRdvDate,
  trackingNumberForSlug,
} from "@/lib/legacy/comptable-acquisition-sequence/dates";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { buildDashboardUrl } from "@/lib/legacy/link-tracking/urls";
import { COMPTABLE_ACQUISITION_OFFER_TYPE } from "@/lib/legacy/payments/comptable-acquisition-offers";
import { E2E_TEST_EMAIL } from "@/lib/test/e2e-identity";

const DRY_RUN = process.argv.includes("--dry-run");
const EXECUTE = process.argv.includes("--execute");
const KEEP = process.argv.includes("--keep");
const NO_EMAIL = process.argv.includes("--no-email");

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d";
const DEBUG_SESSION = "abd286";

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: EXECUTE ? "execute" : "dry-run",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function testRegistryAndTemplates(): Promise<void> {
  const sequence = getEmailSequence("comptable-acquisition-post-payment");
  assert.ok(sequence);
  assert.equal(sequence?.status, "built");
  assert.equal(sequence?.bookingCategory, "comptable");
  assert.deepEqual(BOOKING_SEQUENCE_SLUGS["comptable-acquisition-post-payment"], [
    "comptable_acquisition_welcome",
    "comptable_acquisition_config_ready",
    "comptable_acquisition_rdv_reminder",
    "comptable_acquisition_rdv_final",
  ]);

  const paymentAt = new Date("2026-09-16T12:00:00.000Z");
  const slug = "smoke123";
  const extras = {
    dashboardLink: buildDashboardUrl(slug),
    trackingNumber: trackingNumberForSlug(slug),
    estimatedFirstRdvDate: formatEstimatedFirstRdvDate(paymentAt),
    rdvRangeLabel: acquisitionRdvRangeLabel(),
  };

  for (const emailType of BOOKING_SEQUENCE_SLUGS["comptable-acquisition-post-payment"]) {
    const template = await resolveBookingEmailTemplate({
      category: "comptable",
      emailType,
    });
    assert.ok(template.subject.trim().length > 0, `${emailType} subject empty`);
    assert.ok(template.body.trim().length > 0, `${emailType} body empty`);

    const rendered = await renderCustomBookingEmail({
      category: "comptable",
      subject: template.subject,
      body: template.body,
      emailType,
      firstName: "Marie",
      scheduledAt: null,
      confirmUrl: "",
      dashboardLink: extras.dashboardLink,
      email: E2E_TEST_EMAIL,
      trackingNumber: extras.trackingNumber,
      estimatedFirstRdvDate: extras.estimatedFirstRdvDate,
      rdvRangeLabel: extras.rdvRangeLabel,
    });

    assert.ok(!rendered.text.includes("{{"), `${emailType} has unresolved template vars`);
    assert.ok(rendered.text.includes("HRC-smoke123"), `${emailType} missing tracking number`);
    assert.ok(
      rendered.text.includes("1 489") || emailType !== "comptable_acquisition_welcome",
      `${emailType} welcome should mention 1 489 €`,
    );

    debugLog("B", "smokeComptableAcquisitionE2e.ts:testRegistryAndTemplates", "template rendered", {
      emailType,
      subjectLen: rendered.subject.length,
      textLen: rendered.text.length,
    });
  }

  console.log("OK registry + template render (4 emails)");
}

async function cleanupFakeLead(leadId: string, sessionId: string): Promise<void> {
  const client = createLinkTrackingClient();
  await client.from("booking_email_jobs").delete().eq("lead_id", leadId);
  await client.from("payments").delete().eq("stripe_checkout_session_id", sessionId);
  await client.from("comptable").delete().eq("id", leadId);
}

async function runExecuteFlow(): Promise<void> {
  const client = createLinkTrackingClient();
  const timestamp = Date.now();
  const email =
    process.env.TEST_LEAD_EMAIL?.trim() ||
    `fake-comptable-acq-${timestamp}@hercule.dev`;
  const fakeSessionId = `cs_test_smoke_comptable_acq_${timestamp}`;
  const paymentAt = new Date();

  debugLog("A", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "starting fake lead provision", {
    emailDomain: email.split("@")[1] ?? "?",
    noEmail: NO_EMAIL,
  });

  const { lead, created } = await ensureComptableAcquisitionLead({
    email: NO_EMAIL ? E2E_TEST_EMAIL : email,
    firstName: "Smoke",
    company: "Cabinet Smoke Test",
  });

  debugLog("A", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "lead provisioned", {
    leadId: lead.id,
    slug: lead.slug,
    created,
    productStatut: lead.product_statut,
  });

  assert.equal(lead.product_statut, "PAID_PENDING_ONBOARDING");

  const { error: paymentError } = await client.from("payments").insert({
    comptable_id: lead.id,
    offer_type: COMPTABLE_ACQUISITION_OFFER_TYPE,
    amount_cents: 148_900,
    status: "succeeded",
    stripe_checkout_session_id: fakeSessionId,
    stripe_event_id: `evt_smoke_${timestamp}`,
    succeeded_at: paymentAt.toISOString(),
  });

  if (paymentError) {
    debugLog("A", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "payment insert failed", {
      error: paymentError.message,
      code: paymentError.code,
    });
    throw new Error(`payments insert failed: ${paymentError.message}`);
  }

  const sequence = await startComptableAcquisitionSequence({
    leadId: lead.id,
    paymentAt,
    stripeCheckoutSessionId: fakeSessionId,
  });

  debugLog("C", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "sequence started", {
    welcomeSent: sequence.welcomeSent,
    scheduledJobs: sequence.scheduledJobs,
  });

  assert.equal(sequence.welcomeSent, true, "welcome email should send");
  assert.equal(sequence.scheduledJobs, 3, "expected 3 scheduled follow-up jobs");

  const { data: profileRow } = await client
    .from("comptable")
    .select("profile")
    .eq("id", lead.id)
    .maybeSingle();

  const profile = (profileRow?.profile ?? {}) as Record<string, unknown>;
  const estimated =
    profile.estimated_first_booking_at ??
    ((profile.dashboard as Record<string, unknown> | undefined)?.estimated_first_booking_at ??
      null);

  debugLog("D", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "profile estimated date", {
    hasEstimated: Boolean(estimated),
  });

  assert.ok(estimated, "profile.estimated_first_booking_at should be set");

  const { data: jobs } = await client
    .from("booking_email_jobs")
    .select("email_type, status, scheduled_for")
    .eq("lead_id", lead.id)
    .order("scheduled_for", { ascending: true });

  const jobTypes = (jobs ?? []).map((row) => row.email_type);
  debugLog("C", "smokeComptableAcquisitionE2e.ts:runExecuteFlow", "jobs in db", {
    jobTypes,
    count: jobs?.length ?? 0,
  });

  assert.ok(jobTypes.includes("comptable_acquisition_welcome"));
  assert.ok(jobTypes.includes("comptable_acquisition_config_ready"));
  assert.ok(jobTypes.includes("comptable_acquisition_rdv_reminder"));
  assert.ok(jobTypes.includes("comptable_acquisition_rdv_final"));

  console.log("OK execute flow", {
    leadId: lead.id,
    slug: lead.slug,
    email: lead.email,
    welcomeSent: sequence.welcomeSent,
    scheduledJobs: sequence.scheduledJobs,
    estimatedFirstBookingAt: estimated,
    jobs: jobs?.map((row) => `${row.email_type}:${row.status}`),
  });

  if (!KEEP) {
    await cleanupFakeLead(lead.id, fakeSessionId);
    console.log("OK cleanup (use --keep to retain fake lead)");
  } else {
    console.log(`KEEP lead id=${lead.id} session=${fakeSessionId}`);
  }
}

async function main(): Promise<void> {
  if (!DRY_RUN && !EXECUTE) {
    console.log("Defaulting to --dry-run (pass --execute for live fake lead test)");
  }

  await testRegistryAndTemplates();

  if (EXECUTE) {
    await runExecuteFlow();
    console.log("All comptable acquisition smoke tests passed (execute).");
    return;
  }

  console.log("All comptable acquisition smoke tests passed (dry-run).");
  console.log("Run with --execute to provision a fake lead and trigger E1 + schedule E2–E4.");
}

main().catch((error) => {
  debugLog("E", "smokeComptableAcquisitionE2e.ts:main", "smoke failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
