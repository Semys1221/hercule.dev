/**
 * Send free_trial_1 pitch test via Resend.
 *
 *   pnpm tsx lib/backend/scripts/crm/sendFreeTrialPitchTestEmail.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { DEFAULT_BOOKING_EMAIL_TEMPLATES } from "@/lib/(resend)/communication/templates";
import { ENGIN_TEST_FROM, ENGIN_TEST_RECIPIENT } from "@/lib/engin/communication/constants";
import { getAppBaseUrl } from "@/lib/legacy/payments/stripe";

function loadEnvFromRepoRoot(): void {
  for (const file of [".env", ".env.local"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;

    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFromRepoRoot();

const recipient = ENGIN_TEST_RECIPIENT;
const template = DEFAULT_BOOKING_EMAIL_TEMPLATES.free_trial_1;
const propositionLink = `${getAppBaseUrl().replace(/\/$/, "")}/proposition#essai`;

const text = template.body
  .replace("{{firstNameLine}}", "Bonjour,")
  .replace("{{checkoutTrialLink}}", propositionLink);

async function main() {
  const result = await sendBookingEmail({
    to: recipient,
    subject: template.subject,
    text,
    from: ENGIN_TEST_FROM,
    idempotencyKey: `free-trial-pitch-test:${recipient}:${Date.now()}`,
  });

  if (!result.ok) {
    console.error("Send failed:", result.error);
    process.exit(1);
  }

  console.log(`Sent free_trial_1 test to ${recipient} (id=${result.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
