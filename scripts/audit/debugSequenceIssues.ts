/**
 * Debug probe for comptable/CIF sequence issues. Does not send emails
 * and does not schedule onboarding jobs.
 *
 * pnpm exec tsx --env-file=.env ./scripts/audit/debugSequenceIssues.ts
 */

import { evaluateSequenceSafety } from "@/lib/admin/email-sequences/safety";
import { getEmailSequences } from "@/lib/admin/email-sequences/registry";
import { BOOKING_CONFIRMATION_DISABLED } from "@/lib/booking-communication/confirmation-disabled";
import { executeBypassFlow } from "@/lib/instantly-bypass/send-flow";
import {
  buildTemplateVariables,
} from "@/lib/instantly-bypass/templates";
import { templateRequiresReservationLink } from "@/lib/instantly-bypass/reservation-links";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { listOnboardingReminderCategories } from "@/lib/onboarding-sequence/orchestrator";

const CIF_CAMPAIGN = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const COMPTABLE_CAMPAIGN = "e4c58718-ca00-4e27-b714-68e522fe4db6";

async function main() {
  listOnboardingReminderCategories();

  for (const audience of ["comptable", "cif"] as const) {
    for (const entry of getEmailSequences(audience)) {
      evaluateSequenceSafety(entry, audience);
    }
  }

  const cifBody =
    '<a href="{{reservation_cif_link}}">Proposer mon cabinet</a>';
  templateRequiresReservationLink(cifBody);
  buildTemplateVariables(
    { reservation_cif_link: "https://www.hercule.dev/r/cif/demo" },
    { payload: { reservation_cif_link: "https://www.hercule.dev/r/cif/demo" } },
  );

  const noShow = await executeBypassFlow({
    flow: "no_show_email1",
    campaignId: COMPTABLE_CAMPAIGN,
    leadEmail: "debug-probe@example.com",
  });

  const client = createLinkTrackingClient();
  const { data: templates } = await client
    .from("instantly_bypass_templates")
    .select("campaign_id, template_key, subject, body_html")
    .in("campaign_id", [CIF_CAMPAIGN, COMPTABLE_CAMPAIGN]);

  const byCampaign = new Map<string, string[]>();
  const cifPlaceholders: string[] = [];
  for (const row of templates ?? []) {
    const id = String(row.campaign_id);
    const keys = byCampaign.get(id) ?? [];
    keys.push(String(row.template_key));
    byCampaign.set(id, keys);
    if (
      id === CIF_CAMPAIGN &&
      String(row.body_html || "").includes("{{reservation_cif_link}}")
    ) {
      cifPlaceholders.push(String(row.template_key));
    }
  }

  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8b6caf",
    },
    body: JSON.stringify({
      sessionId: "8b6caf",
      location: "scripts/audit/debugSequenceIssues.ts",
      message: "probe snapshot",
      data: {
        meetingDisabled: BOOKING_CONFIRMATION_DISABLED,
        noShowResult: noShow,
        comptableKeys: byCampaign.get(COMPTABLE_CAMPAIGN) ?? [],
        cifKeys: byCampaign.get(CIF_CAMPAIGN) ?? [],
        cifTemplatesWithCifPlaceholder: cifPlaceholders,
        hypothesisId: "C,D,E",
      },
      timestamp: Date.now(),
      hypothesisId: "C,D,E",
      runId: "pre-fix",
    }),
  }).catch(() => {});

  const testRes = await fetch(
    "http://127.0.0.1:3000/api/admin/sequences/meeting-cif/test",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche: "cif",
        stepId: "immediate",
        recipientEmail: "debug-probe@example.com",
      }),
    },
  ).catch((error: unknown) => ({
    ok: false,
    status: 0,
    json: async () => ({
      error: error instanceof Error ? error.message : "fetch_failed",
    }),
  }));

  const testBody = await testRes.json().catch(() => ({}));
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8b6caf",
    },
    body: JSON.stringify({
      sessionId: "8b6caf",
      location: "scripts/audit/debugSequenceIssues.ts:test-api",
      message: "CIF sequence test API probe",
      data: {
        status: "status" in testRes ? testRes.status : 0,
        body: testBody,
        hypothesisId: "A",
      },
      timestamp: Date.now(),
      hypothesisId: "A",
      runId: "pre-fix",
    }),
  }).catch(() => {});

  console.log("debugSequenceIssues probe complete", {
    meetingDisabled: BOOKING_CONFIRMATION_DISABLED,
    noShowResult: noShow,
    testStatus: "status" in testRes ? testRes.status : 0,
    testBody,
    comptableKeys: byCampaign.get(COMPTABLE_CAMPAIGN) ?? [],
    cifKeys: byCampaign.get(CIF_CAMPAIGN) ?? [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
