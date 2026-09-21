/**
 * Smoke: create a conference client row and start payment-onboarding E1 → contact@hercule.dev
 *
 * Usage: pnpm exec tsx --env-file=.env scripts/smoke-payment-onboarding-conference.ts
 */
import { randomBytes } from "node:crypto";

import { startPaymentOnboardingSequence } from "../lib/(resend)/onboarding";
import { buildClientDashboardUrl, createClientsClient } from "../lib/clients/supabase";

const RECIPIENT = "contact@hercule.dev";

async function main() {
  if (process.env.PAYMENT_ONBOARDING_SEQUENCE_ENABLED !== "1") {
    throw new Error("Set PAYMENT_ONBOARDING_SEQUENCE_ENABLED=1");
  }

  const client = createClientsClient();
  const slug = `smk${randomBytes(3).toString("hex")}`;
  const sessionId = `smoke_session_${Date.now()}`;

  const { data: row, error } = await client
    .from("clients")
    .insert({
      email: RECIPIENT,
      slug,
      client_type: "dec",
      billing: "monthly",
      offer_type: "conference_dec_monthly",
      rdv_total: 10,
      rdv_used: 0,
      first_name: "Smoke",
    })
    .select("id, slug")
    .single();

  if (error || !row) {
    throw new Error(error?.message ?? "Failed to insert smoke client");
  }

  console.log("Created client", row.id, row.slug);

  const result = await startPaymentOnboardingSequence({
    vertical: "dec",
    recipientEmail: RECIPIENT,
    leadId: row.id,
    leadCategory: "client",
    paymentAt: new Date(),
    stripeCheckoutSessionId: sessionId,
    dashboardLink: buildClientDashboardUrl(row.slug),
  });

  console.log("Sequence result:", result);
  console.log(`E1 should be in inbox for ${RECIPIENT}`);
  console.log(`Dashboard: ${buildClientDashboardUrl(row.slug)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
