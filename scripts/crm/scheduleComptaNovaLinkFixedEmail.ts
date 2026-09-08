/**
 * Schedule a one-off apology / link-fixed email for ComptaNova.
 *
 * Usage:
 *   pnpm schedule-compta-nova-apology              # dry-run preview + schedule time
 *   pnpm schedule-compta-nova-apology -- --schedule  # insert pending job (cron sends)
 *   pnpm schedule-compta-nova-apology -- --send-now  # send immediately (test)
 */
import { insertJob } from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import { formatParisSlot } from "@/lib/booking-communication/send-window";
import {
  addDaysToParisDateKey,
  parisAtHourOnDateKey,
  parisDateKeyForInstant,
} from "@/lib/instantly-bypass/send-window";
import {
  COMPTA_NOVA_APOLOGY_EMAIL,
  COMPTA_NOVA_APOLOGY_IDEMPOTENCY_KEY,
  renderComptaNovaApologyEmail,
} from "@/lib/modalites-campaign/compta-nova-apology";
import {
  createLinkTrackingClient,
  findLeadByEmail,
} from "@/lib/link-tracking/supabase";

const PARIS_SEND_HOUR = 8;

type Args = {
  schedule: boolean;
  sendNow: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  return {
    schedule: argv.includes("--schedule"),
    sendNow: argv.includes("--send-now"),
  };
}

function defaultSendAt(now = new Date()): Date {
  const tomorrowKey = addDaysToParisDateKey(parisDateKeyForInstant(now), 1);
  return parisAtHourOnDateKey(tomorrowKey, PARIS_SEND_HOUR);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, COMPTA_NOVA_APOLOGY_EMAIL);

  if (!lookup) {
    throw new Error(`Lead not found: ${COMPTA_NOVA_APOLOGY_EMAIL}`);
  }

  const scheduledFor = defaultSendAt();
  const rendered = await renderComptaNovaApologyEmail(lookup.lead);

  console.log("=== ComptaNova apology email ===");
  console.log(`To: ${lookup.lead.email}`);
  console.log(`Subject: ${rendered.subject}`);
  console.log(`Scheduled for: ${formatParisSlot(scheduledFor)}`);
  console.log("\n--- Text ---\n");
  console.log(rendered.text);
  if (rendered.html) {
    console.log("\n(HTML version will be sent)");
  }

  if (args.sendNow) {
    const result = await sendBookingEmail({
      to: lookup.lead.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      idempotencyKey: `${COMPTA_NOVA_APOLOGY_IDEMPOTENCY_KEY}/now-${Date.now()}`,
    });
    if (!result.ok) {
      throw new Error(result.error);
    }
    console.log(`\nOK sent now (Resend id: ${result.id})`);
    return;
  }

  if (!args.schedule) {
    console.log("\nDry run. Re-run with --schedule to queue for cron, or --send-now to test.");
    return;
  }

  const job = await insertJob({
    category: lookup.category,
    leadId: lookup.lead.id,
    emailType: "h24_relance",
    scheduledFor,
    triggeredBy: "manual",
    idempotencyKey: COMPTA_NOVA_APOLOGY_IDEMPOTENCY_KEY,
    useHtml: true,
  });

  if (!job) {
    console.log("\nJob already scheduled (duplicate idempotency key).");
    return;
  }

  console.log(`\nOK scheduled job ${job.id} for ${formatParisSlot(scheduledFor)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
