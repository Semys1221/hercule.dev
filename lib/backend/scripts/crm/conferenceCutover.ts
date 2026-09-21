/**
 * CIF conference cutover — cancel Calendly 1:1 (except keepers), reset NOTBOOKED,
 * preview conference invite sequence (no real cohort send without approval).
 *
 * Usage:
 *   pnpm conference-cutover -- --dry-run
 *   pnpm conference-cutover -- --execute
 *   pnpm conference-cutover -- --dry-run --preview-emails
 *   pnpm conference-cutover -- --test-fake-lead
 *   pnpm conference-cutover -- --dry-run --provision-missing-cohort
 *   CONFERENCE_INVITE_SEND_ENABLED=true pnpm conference-cutover -- --provision-missing-cohort
 */
import {
  cancelScheduledEvent,
  extractUuidFromCalendlyUri,
} from "@/lib/legacy/calendly";
import {
  type CalendlyBookingRow,
  isCalendlyBookingCanceled,
  listUpcomingBookings,
} from "@/lib/legacy/calendly/list-bookings";
import {
  cancelConferenceInviteJobs,
  cancelFollowUpJobs,
} from "@/lib/legacy/booking-communication/jobs";
import { getBookingEmailTemplates, previewTemplate } from "@/lib/legacy/booking-communication/template-store";
import {
  CIF_CONFERENCE_CUTOVER_MISSING_EMAILS,
  isConferenceInviteKeeperEmail,
  isConferenceInviteSendEnabled,
} from "@/lib/legacy/cif-conference-sequence/constants";
import {
  ensureConferenceTestLead,
  startConferenceInviteSequence,
} from "@/lib/legacy/cif-conference-sequence/orchestrator";
import {
  ensureCifLeadForConferenceCutover,
  findCifLeadByEmail,
} from "@/lib/legacy/cif-conference-sequence/provision-cutover-lead";
import { syncLeadStatutToInstantly } from "@/lib/legacy/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  markLeadNotBooked,
} from "@/lib/legacy/link-tracking/supabase";
import { buildCifLeadUrls, getTrackingBaseUrl } from "@/lib/legacy/link-tracking/urls";

const CANCEL_REASON =
  "Cutover conférence CIF — rendez-vous 1:1 remplacé par la conférence hebdomadaire.";

type Args = {
  dryRun: boolean;
  execute: boolean;
  previewEmails: boolean;
  testFakeLead: boolean;
  cohortOnly: boolean;
  provisionMissingCohort: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const provisionMissingCohort = argv.includes("--provision-missing-cohort");
  return {
    dryRun:
      argv.includes("--dry-run") ||
      (!argv.includes("--execute") &&
        !argv.includes("--test-fake-lead") &&
        !argv.includes("--cohort-only") &&
        !provisionMissingCohort),
    execute: argv.includes("--execute"),
    previewEmails: argv.includes("--preview-emails"),
    testFakeLead: argv.includes("--test-fake-lead"),
    cohortOnly: argv.includes("--cohort-only"),
    provisionMissingCohort,
  };
}

function formatWhen(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16);
}

async function listCutoverCanceledBookings(): Promise<CalendlyBookingRow[]> {
  const [cif, comptable] = await Promise.all([
    listUpcomingBookings({ niche: "cif", daysAhead: 60, daysBehind: 7 }),
    listUpcomingBookings({ niche: "comptable", daysAhead: 60, daysBehind: 7 }),
  ]);

  const calendlyByEmail = new Map<string, CalendlyBookingRow>();
  for (const row of [...cif, ...comptable]) {
    if (!isCalendlyBookingCanceled(row)) {
      continue;
    }
    if (isConferenceInviteKeeperEmail(row.email)) {
      continue;
    }
    const email = row.email.trim().toLowerCase();
    if (!email) {
      continue;
    }
    calendlyByEmail.set(email, row);
  }

  return CIF_CONFERENCE_CUTOVER_MISSING_EMAILS.map((email) => {
    const fromCalendly = calendlyByEmail.get(email);
    if (fromCalendly) {
      return fromCalendly;
    }

    return {
      email,
      name: "",
      first_name: null,
      company: null,
      start_time: "",
      invitee_uri: "",
      event_uri: "",
      event_status: "canceled" as const,
      invitee_status: "canceled" as const,
      questions: {},
      slug: null,
      lead_id: null,
      lead_category: null,
      booking_category: "agence" as const,
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
    };
  });
}

async function hasConferenceSequenceStarted(leadId: string): Promise<boolean> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id")
    .eq("lead_id", leadId)
    .eq("lead_category", "cif")
    .eq("email_type", "conference_invite")
    .eq("status", "sent")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check conference sequence for ${leadId}: ${error.message}`);
  }

  return Boolean(data);
}

async function runProvisionMissingCohort(dryRun: boolean): Promise<void> {
  console.log("\n--- Provision missing CIF cohort ---");
  if (!dryRun && !isConferenceInviteSendEnabled()) {
    throw new Error("CONFERENCE_INVITE_SEND_ENABLED must be true for --provision-missing-cohort");
  }

  const bookings = await listCutoverCanceledBookings();
  console.log(`  canceled bookings to inspect: ${bookings.length}`);

  let provisioned = 0;
  let sequencesStarted = 0;
  let skippedHasCifSequence = 0;
  let failed = 0;

  for (const booking of bookings) {
    const email = booking.email.trim().toLowerCase();
    const existingCif = await findCifLeadByEmail(email);

    if (existingCif && (await hasConferenceSequenceStarted(existingCif.id))) {
      console.log(`  skip ${email}: conference sequence already sent`);
      skippedHasCifSequence += 1;
      continue;
    }

    try {
      const ensured = await ensureCifLeadForConferenceCutover({
        email,
        firstName: booking.first_name,
        company: booking.company,
        dryRun,
      });

      console.log(
        `  ${dryRun ? "[dry-run] would provision" : "provisioned"} ${email}: slug=${ensured.slug} created=${ensured.created} updated=${ensured.updated}`,
      );
      provisioned += 1;

      if (dryRun) {
        console.log("    sequence preview: D0 + 3 follow-ups (conference_invite, _24, _48, _72)");
        sequencesStarted += 1;
        continue;
      }

      const result = await startConferenceInviteSequence({ leadId: ensured.leadId });
      if (!result.started) {
        console.warn(`  failed sequence ${email}: ${result.reason ?? "unknown"}`);
        failed += 1;
        continue;
      }

      console.log(
        `  started ${email}: welcome=${result.welcomeSent ? "sent" : "no"} jobs=${result.scheduledJobs ?? 0}`,
      );
      sequencesStarted += 1;
    } catch (err) {
      console.error(`  error ${email}: ${err instanceof Error ? err.message : err}`);
      failed += 1;
    }
  }

  console.log(
    `\nMissing cohort summary: ${provisioned} provisioned, ${sequencesStarted} sequences ${dryRun ? "previewed" : "started"}, ${skippedHasCifSequence} already sent, ${failed} failed`,
  );
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

async function enqueueConferenceCohortForEmails(emails: string[]): Promise<void> {
  console.log("\n--- Conference invite cohort ---");
  const client = createLinkTrackingClient();
  let started = 0;
  let skipped = 0;
  let failed = 0;

  for (const email of emails) {
    const lookup = await findLeadByEmail(client, email);
    if (!lookup || lookup.category !== "cif") {
      console.log(`  skip ${email}: not a CIF lead`);
      skipped += 1;
      continue;
    }

    try {
      const result = await startConferenceInviteSequence({ leadId: lookup.lead.id });
      if (!result.started) {
        console.warn(`  failed ${email}: ${result.reason ?? "unknown"}`);
        failed += 1;
        continue;
      }
      console.log(
        `  started ${email}: welcome=${result.welcomeSent ? "sent" : "no"} jobs=${result.scheduledJobs ?? 0}`,
      );
      started += 1;
    } catch (err) {
      console.error(
        `  error ${email}: ${err instanceof Error ? err.message : err}`,
      );
      failed += 1;
    }
  }

  console.log(`\nCohort summary: ${started} started, ${skipped} skipped, ${failed} failed`);
}

async function listCifNotBookedEmailsForCohort(): Promise<string[]> {
  const client = createLinkTrackingClient();
  const since = new Date();
  since.setHours(since.getHours() - 6);

  const { data, error } = await client
    .from("cif")
    .select("email")
    .eq("statut", "NOTBOOKED")
    .gte("updated_at", since.toISOString());

  if (error) {
    throw new Error(`Failed to list NOTBOOKED CIF leads: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email))
    .filter((email) => !isConferenceInviteKeeperEmail(email));
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
    `mode: ${args.testFakeLead ? "test-fake-lead" : args.provisionMissingCohort ? args.dryRun ? "provision-missing-cohort-dry-run" : "provision-missing-cohort" : args.cohortOnly ? "cohort-only" : args.execute ? "execute" : "dry-run"}`,
  );

  await previewRedirectsAndLinks();

  if (args.provisionMissingCohort) {
    await runProvisionMissingCohort(args.dryRun);
    return;
  }

  if (args.previewEmails || (args.dryRun && !args.cohortOnly)) {
    await previewConferenceEmails();
  }

  const bookings = await listActiveBookings();
  const keepers = bookings.filter((row) => isConferenceInviteKeeperEmail(row.email));
  const toCancel = bookings.filter((row) => !isConferenceInviteKeeperEmail(row.email));

  if (args.cohortOnly) {
    if (!isConferenceInviteSendEnabled()) {
      throw new Error("CONFERENCE_INVITE_SEND_ENABLED must be true for --cohort-only");
    }
    const emails = await listCifNotBookedEmailsForCohort();
    console.log(`\nCIF NOTBOOKED leads for cohort: ${emails.length}`);
    await enqueueConferenceCohortForEmails(emails);
    console.log("\nCohort-only complete.");
    return;
  }

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

    if (isConferenceInviteSendEnabled()) {
      await enqueueConferenceCohortForEmails(
        toCancel.map((row) => row.email.trim().toLowerCase()),
      );
      console.log("\nExecute complete — Calendly canceled, CRM reset, cohort sequences started.");
    } else {
      console.log("\nExecute complete — no conference relance enqueued (set CONFERENCE_INVITE_SEND_ENABLED=true).");
    }
    return;
  }

  console.log("\nready to send waiting for approval");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
