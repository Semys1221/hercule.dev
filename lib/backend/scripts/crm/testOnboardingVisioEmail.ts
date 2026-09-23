/**
 * Send a test onboarding visio notification via Resend.
 *
 *   pnpm tsx lib/backend/scripts/crm/testOnboardingVisioEmail.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { notifyOnboardingAnswers } from "@/lib/(resend)/clients/workflows/onboarding-video-conference";

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
import {
  CONFERENCE_CLIENT_TYPES,
  OFFER_TYPES_CONFERENCE,
} from "@/lib/commercial/conference-pricing";
import type { ClientRow } from "@/lib/clients/types";

const opsEmail =
  process.env.NOTIFICATION_OPS_EMAIL?.trim() ||
  process.env.RESEND_CONTACT_TO?.trim() ||
  process.env.NEXT_PUBLIC_OPS_TEST_EMAIL?.trim();

if (!opsEmail) {
  console.error(
    "Set NOTIFICATION_OPS_EMAIL (or RESEND_CONTACT_TO / NEXT_PUBLIC_OPS_TEST_EMAIL for local test).",
  );
  process.exit(1);
}

process.env.NOTIFICATION_OPS_EMAIL = opsEmail;

if (!process.env.RESEND_API_KEY?.trim()) {
  console.error("RESEND_API_KEY is not set.");
  process.exit(1);
}

const testClient: ClientRow = {
  id: "test-onboarding-visio",
  email: "test-client@example.com",
  slug: "test-onboarding-visio",
  first_name: "Test",
  client_type: CONFERENCE_CLIENT_TYPES.cif,
  secondary_vertical: null,
  billing: "monthly",
  offer_type: OFFER_TYPES_CONFERENCE.cifMonthly,
  rdv_total: 10,
  rdv_used: 0,
  first_lead_at: new Date().toISOString(),
  calendly_scheduling_url: null,
  calendly_event_type_uri: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  product_statut: "ONBOARDED",
  onboarding_completed_at: new Date().toISOString(),
  retraction_status: "pending",
  retraction_ends_at: null,
  retraction_waived_at: null,
  profile: { video_conference: "google_meet_pro" },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function main(): Promise<void> {
  await notifyOnboardingAnswers(
    {
      client: testClient,
      videoConference: "google_meet_pro",
      startNow: false,
      unavailability: "Aucune",
    },
    { copyClient: false },
  );
  console.log(`Test onboarding visio email sent to ${opsEmail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
