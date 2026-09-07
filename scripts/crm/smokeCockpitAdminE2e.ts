/**
 * API-level dry run for cockpit admin endpoints (no browser).
 *
 * Usage:
 *   pnpm smoke-cockpit-admin-e2e
 */
import assert from "node:assert/strict";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

import {
  bootstrapDryRunClient,
  cleanupSalesSession,
  createMatchViaApi,
  createScheduledAppointment,
} from "../../e2e/helpers/cockpit-fixture";
import {
  assertEmailJobsForLead,
  assertTimelineFirstStepActive,
  assertTimelineLabel,
  getAgenceIdBySlug,
  getAgenceProductStatut,
  getEntrepriseIdBySlug,
  getLatestMatchForAgence,
  getScheduledAppointmentsForAgence,
  pollAgenceProductStatut,
  TEST_AGENCE_SLUG,
  TEST_ENTREPRISE_ACME_SLUG,
} from "../../e2e/helpers/supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

async function main(): Promise<void> {
  const { request } = await import("@playwright/test");
  const ctx = await request.newContext({ baseURL: BASE_URL });

  console.log("cockpit admin API dry-run starting…");

  await cleanupSalesSession(ctx);
  await bootstrapDryRunClient(ctx);

  const dashboard = await ctx.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
  assert.equal(dashboard.status(), 200);
  const dashboardBody = (await dashboard.json()) as { productStatut?: string };
  assert.equal(dashboardBody.productStatut, "IN_DELIVERANCE");

  const list = await ctx.get("/api/admin/clients?category=agence&all=true");
  assert.equal(list.status(), 200);

  const seed = await ctx.post("/api/admin/clients/seed");
  assert.equal(seed.status(), 200);

  const matchId = await createMatchViaApi(ctx, TEST_ENTREPRISE_ACME_SLUG);
  const entrepriseId = await getEntrepriseIdBySlug(TEST_ENTREPRISE_ACME_SLUG);
  await assertEmailJobsForLead("entreprise", entrepriseId, [
    { emailType: "match_proposal", allowedStatuses: ["sent", "failed"] },
    { emailType: "match_proposal_followup", status: "pending" },
  ]);

  const agenceId = await getAgenceIdBySlug(TEST_AGENCE_SLUG);
  await createScheduledAppointment(ctx, matchId);

  for (const action of ["search_started", "milestone", "waitlist"] as const) {
    const response = await ctx.post(`/api/admin/deliverance/${matchId}`, {
      data: { action },
    });
    assert.equal(response.status(), 200, `deliverance ${action}`);
  }

  await assertTimelineFirstStepActive(TEST_AGENCE_SLUG);

  const appointments = await getScheduledAppointmentsForAgence(agenceId);
  const scheduled = appointments.find((row) => row.status === "scheduled");
  assert.ok(scheduled, "scheduled appointment expected");

  const noShow = await ctx.post(`/api/admin/appointments/${scheduled!.id}/no-show`, {
    data: { reporter: "entreprise" },
  });
  assert.equal(noShow.status(), 200);
  assert.equal(await getAgenceProductStatut(TEST_AGENCE_SLUG), "IN_DELIVERANCE");

  await createScheduledAppointment(ctx, matchId);

  const appointmentsAfter = await getScheduledAppointmentsForAgence(agenceId);
  const scheduledAgain = appointmentsAfter.find((row) => row.status === "scheduled");
  assert.ok(scheduledAgain, "scheduled appointment after no-show");

  const complete = await ctx.post(`/api/admin/appointments/${scheduledAgain!.id}/complete`);
  if (complete.status() !== 200) {
    console.error("complete failed:", await complete.text());
  }
  assert.equal(complete.status(), 200);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "POST_RDV_SURVEY");

  const timelineLabel = `API E2E timeline ${Date.now()}`;
  const timeline = await ctx.patch(`/api/admin/clients/agence/${TEST_AGENCE_SLUG}/timeline`, {
    data: {
      timeline: [
        { id: "confirmed", label: timelineLabel, status: "done" },
        { id: "setup", label: "Mise en place", status: "pending" },
        { id: "preparation", label: "Mise en relation", status: "pending" },
        { id: "delivery", label: "Première demande attribuée", status: "pending" },
      ],
    },
  });
  assert.equal(timeline.status(), 200);
  await assertTimelineLabel(TEST_AGENCE_SLUG, timelineLabel);

  const email = await ctx.post(`/api/admin/clients/agence/${TEST_AGENCE_SLUG}/email`, {
    data: { emailType: "onboarding_j0" },
  });
  assert.equal(email.status(), 200);

  const cockpit = await ctx.get(`/api/admin/clients/agence/${TEST_AGENCE_SLUG}`);
  assert.equal(cockpit.status(), 200);

  await cleanupSalesSession(ctx);
  await ctx.dispose();

  console.log("cockpit admin API dry-run passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
