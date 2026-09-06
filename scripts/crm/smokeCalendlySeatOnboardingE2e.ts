/**
 * Smoke test: Calendly seat onboarding workflow.
 * Note: as of dashboard v2, this workflow is triggered AFTER onboarding form
 * completion (PATCH completeOnboarding=true), not at Stripe payment.
 *
 *   pnpm smoke-calendly-seat-onboarding --dry-run
 *   pnpm smoke-calendly-seat-onboarding --agence-id=<uuid> --execute
 */

import assert from "node:assert/strict";

import {
  getEmailSequence,
  BOOKING_SEQUENCE_SLUGS,
} from "@/lib/admin/email-sequences/registry";
import {
  renderCustomBookingEmail,
  upsertBookingEmailTemplates,
  getBookingEmailTemplates,
} from "@/lib/booking-communication/template-store";
import {
  checkCalendlySeatWorkflows,
  startCalendlySeatWorkflow,
} from "@/lib/calendly-seat-onboarding/orchestrator";
import { getCalendlySeatStatus } from "@/lib/calendly/org";

const DRY_RUN = process.argv.includes("--dry-run");
const EXECUTE = process.argv.includes("--execute");

function readAgenceId(): string | null {
  const arg = process.argv.find((item) => item.startsWith("--agence-id="));
  return arg?.split("=")[1]?.trim() ?? null;
}

async function testRegistryAndEditorPersistence(): Promise<void> {
  const sequence = getEmailSequence("calendly-seat-onboarding");
  assert.ok(sequence);
  assert.equal(sequence?.status, "built");
  assert.equal(sequence?.editorKind, "booking");
  assert.deepEqual(BOOKING_SEQUENCE_SLUGS["calendly-seat-onboarding"], [
    "product_calendly_welcome",
    "product_calendly_reminder",
  ]);

  const marker = `[smoke-calendly-seat ${Date.now()}]`;
  await upsertBookingEmailTemplates("agence", [
    {
      email_type: "product_calendly_welcome",
      subject: `${marker} Bienvenue`,
      body: `${marker}\n\n{{dashboardLink}}`,
    },
    {
      email_type: "product_calendly_reminder",
      subject: `${marker} Rappel`,
      body: `${marker}\n\n{{email}}`,
    },
  ]);

  const templates = await getBookingEmailTemplates("agence");
  const welcome = templates.find((row) => row.email_type === "product_calendly_welcome");
  const reminder = templates.find((row) => row.email_type === "product_calendly_reminder");
  assert.ok(welcome?.subject.includes(marker));
  assert.ok(reminder?.subject.includes(marker));

  const rendered = await renderCustomBookingEmail({
    category: "agence",
    subject: welcome!.subject,
    body: welcome!.body,
    emailType: "product_calendly_welcome",
    firstName: "Jean",
    scheduledAt: null,
    confirmUrl: "",
    dashboardLink: "https://www.hercule.dev/dashboard/test",
    company: "Test SARL",
    email: "jean@example.com",
  });
  assert.ok(rendered.subject.includes(marker));
  assert.ok(rendered.text.includes("https://www.hercule.dev/dashboard/test"));
  assert.ok(!rendered.text.includes("{{dashboardLink}}"));
}

async function main(): Promise<void> {
  const agenceId = readAgenceId();

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  if (agenceId) {
    console.log(`Agence: ${agenceId}`);
  }

  await testRegistryAndEditorPersistence();
  console.log("OK registry + editor persistence");

  const renderedWelcome = await renderCustomBookingEmail({
    category: "agence",
    subject: "Test",
    body: "Bonjour {{firstNameLine}}\n\n{{dashboardLink}}",
    emailType: "product_calendly_welcome",
    firstName: "Jean",
    scheduledAt: null,
    confirmUrl: "",
    dashboardLink: "https://www.hercule.dev/dashboard/exemple",
    email: "jean@example.com",
  });
  assert.ok(renderedWelcome.text.includes("dashboard/exemple"));
  console.log("OK product email render");

  if (DRY_RUN || !EXECUTE) {
    if (!agenceId) {
      console.log("SKIP workflow start (no --agence-id)");
    } else {
      const start = await startCalendlySeatWorkflow(agenceId, { dryRun: true });
      assert.equal(start.dryRun, true);
      assert.equal(start.agenceId, agenceId);
      console.log("OK start workflow dry-run", start);
    }

    const check = await checkCalendlySeatWorkflows({ dryRun: true });
    assert.equal(check.dryRun, true);
    console.log("OK cron check dry-run", {
      checked: check.checked,
      details: check.details.length,
    });
    console.log("All Calendly seat onboarding dry-run tests passed.");
    return;
  }

  if (!agenceId) {
    throw new Error("--agence-id is required with --execute");
  }

  const start = await startCalendlySeatWorkflow(agenceId);
  console.log("start workflow", start);

  const seatStatus = await getCalendlySeatStatus(start.email);
  console.log("Calendly seat status", seatStatus);

  const check = await checkCalendlySeatWorkflows({ dryRun: false });
  console.log("cron check", check);

  console.log("Execute smoke completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
