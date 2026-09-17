/**
 * CIF conference cutover — cancel Calendly 1:1 (except keepers), reset NOTBOOKED,
 * preview conference invite sequence (no real cohort send without approval).
 *
 * Usage:
 *   pnpm conference-cutover -- --dry-run
 *   pnpm conference-cutover -- --execute
 *   pnpm conference-cutover -- --dry-run --preview-emails
 *   pnpm conference-cutover -- --test-fake-lead
 */
import {
  cancelScheduledEvent,
  extractUuidFromCalendlyUri,
} from "@/lib/calendly";
import { isCalendlyBookingCanceled, listUpcomingBookings } from "@/lib/calendly/list-bookings";
import {
  cancelConferenceInviteJobs,
  cancelFollowUpJobs,
} from "@/lib/booking-communication/jobs";
import { getBookingEmailTemplates, previewTemplate } from "@/lib/booking-communication/template-store";
import {
  isConferenceInviteKeeperEmail,
} from "@/lib/cif-conference-sequence/constants";
import {
  ensureConferenceTestLead,
  startConferenceInviteSequence,
} from "@/lib/cif-conference-sequence/orchestrator";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  markLeadNotBooked,
} from "@/lib/link-tracking/supabase";
import { buildCifLeadUrls, getTrackingBaseUrl } from "@/lib/link-tracking/urls";

const CANCEL_REASON =
  "Cutover conférence CIF — rendez-vous 1:1 remplacé par la conférence hebdomadaire.";

type Args = {
  dryRun: boolean;
  execute: boolean;
  previewEmails: boolean;
  testFakeLead: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  return {
    dryRun: argv.includes("--dry-run") || (!argv.includes("--execute") && !argv.includes("--test-fake-lead")),
    execute: argv.includes("--execute"),
    previewEmails: argv.includes("--preview-emails"),
    testFakeLead: argv.includes("--test-fake-lead"),
  };
}

function formatWhen(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
}

async function listActiveBookings() {
  const [cif, comptable] = await Promise.all([
    listUpcomingBookings({ niche: "cif", daysAhead: 60 }),
    listUpcomingBookings({ niche: "comptable", daysAhead: 60 }),
  ]);

  return [...cif, ...comptable].filter((row) => !isCalendlyBookingCanceled(row));
}

async function resetLeadNotBooked(email: string, dryRun: boolean): Promise<void> {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, email);
  if (!lookup) {
    console.warn(`  no CRM lead for ${email} — skip NOTBOOKED reset`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] would reset ${email} (${lookup.category}) → NOTBOOKED`);
    return;
  }

  const reset = await markLeadNotBooked(client, lookup);
  await cancelFollowUpJobs(reset.lead.id);
  await cancelConferenceInviteJobs(reset.lead.id);

  try {
    await syncLeadStatutToInstantly(reset.lead, reset.category, "NOTBOOKED");
  } catch (err) {
    console.warn(
      `  Instantly sync failed for ${email}: ${err instanceof Error ? err.message : err}`,
    );
  }

  console.log(`  reset ${email} (${reset.category}) → NOTBOOKED`);
}

async function cancelBooking(
  email: string,
  eventUri: string,
  startTime: string,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(`  [dry-run] would cancel ${email} @ ${formatWhen(startTime)} UTC`);
    await resetLeadNotBooked(email, true);
    return;
  }

  const eventUuid = extractUuidFromCalendlyUri(eventUri);
  await cancelScheduledEvent(eventUuid, CANCEL_REASON);
  console.log(`  cancelled ${email} @ ${formatWhen(startTime)} UTC`);
  await resetLeadNotBooked(email, false);
}

async function previewConferenceEmails(): Promise<void> {
  console.log("\n--- Conference invite email previews (render only) ---");
  const templates = await getBookingEmailTemplates("cif");
  for (const row of templates) {
    const rendered = await previewTemplate(row.subject, row.body, row.email_type, undefined, "cif");
    console.log(`\n[${row.email_type}] ${rendered.subject || row.subject}`);
    console.log(rendered.text.slice(0, 400) + (rendered.text.length > 400 ? "…" : ""));
  }
}

async function previewRedirectsAndLinks(): Promise<void> {
  console.log("\n--- Redirects & tracking ---");
  console.log("  /reservation-cif.html → /reservation-conference.html (Vercel redirect + legacy JS)");
  console.log("  TRACKING_BASE_URL_CIF default:", getTrackingBaseUrl("cif"));
  const sample = buildCifLeadUrls("sample-slug", "prospect@example.com");
  console.log("  sample reservation_cif_link:", sample.reservation_cif_link);
}

async function dryRunSequenceForCanceledEmails(emails: string[]): Promise<void> {
  console.log("\n--- Sequence enqueue (dry-run — no jobs inserted) ---");
  const client = createLinkTrackingClient();

  for (const email of emails) {
    const lookup = await findLeadByEmail(client, email);
    if (!lookup || lookup.category !== "cif") {
      console.log(`  skip sequence preview ${email}: not a CIF lead`);
      continue;
    }

    const preview = await startConferenceInviteSequence({
      leadId: lookup.lead.id,
      dryRun: true,
    });

    console.log(`  ${email}: ${preview.scheduledJobs ?? 0} job(s)`);
    for (const job of preview.preview ?? []) {
      console.log(`    - ${job.emailType} @ ${job.scheduledFor}`);
    }
  }

  console.log("\n  Real cohort enqueue blocked until CONFERENCE_INVITE_SEND_ENABLED=true + explicit approval.");
}

async function runFakeLeadTest(): Promise<void> {
  console.log("\n--- Fake lead sequence test ---");
  const lead = await ensureConferenceTestLead();
  console.log(`  test lead: ${lead.email} (${lead.id}) slug=${lead.slug}`);

  const result = await startConferenceInviteSequence({
    leadId: lead.id,
    forceSend: true,
  });

  console.log(JSON.stringify(result, null, 2));

  if (!result.started) {
    throw new Error(`Fake lead sequence failed: ${result.reason ?? "unknown"}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs();

  console.log("CIF conference cutover");
  console.log(
    `mode: ${args.testFakeLead ? "test-fake-lead" : args.execute ? "execute" : "dry-run"}`,
  );

  await previewRedirectsAndLinks();

  if (args.previewEmails || args.dryRun) {
    await previewConferenceEmails();
  }

  const bookings = await listActiveBookings();
  const keepers = bookings.filter((row) => isConferenceInviteKeeperEmail(row.email));
  const toCancel = bookings.filter((row) => !isConferenceInviteKeeperEmail(row.email));

  console.log(`\n--- Calendly upcoming (${bookings.length} active) ---`);
  console.log(`  keep (${keepers.length}):`);
  for (const row of keepers) {
    console.log(
      `    ✓ ${row.email} — ${row.booking_category} @ ${formatWhen(row.start_time)} UTC`,
    );
  }

  console.log(`  cancel (${toCancel.length}):`);
  for (const row of toCancel) {
    console.log(
      `    ✗ ${row.email} — ${row.booking_category} @ ${formatWhen(row.start_time)} UTC`,
    );
  }

  if (args.testFakeLead) {
    await runFakeLeadTest();
    console.log("\nready to send waiting for approval");
    return;
  }

  if (args.dryRun && !args.execute) {
    for (const row of toCancel) {
      await cancelBooking(row.email, row.event_uri, row.start_time, true);
    }
    await dryRunSequenceForCanceledEmails(
      toCancel.map((row) => row.email.trim().toLowerCase()),
    );
    console.log("\nDry-run complete. Re-run with --execute to cancel Calendly + reset CRM.");
    console.log("ready to send waiting for approval");
    return;
  }

  if (args.execute) {
    for (const row of toCancel) {
      try {
        await cancelBooking(row.email, row.event_uri, row.start_time, false);
      } catch (err) {
        console.error(
          `  error cancelling ${row.email}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    console.log("\nExecute complete — no conference relance enqueued on real cohort.");
    console.log("ready to send waiting for approval");
    return;
  }

  console.log("\nready to send waiting for approval");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
