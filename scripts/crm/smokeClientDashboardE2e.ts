/**
 * API-level dry run for client dashboard endpoints (no browser).
 */
import assert from "node:assert/strict";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

import {
  cleanupSalesSession,
  completeOnboardingApi,
  provisionSalesSession,
  skipPayment,
} from "../../e2e/helpers/cockpit-fixture";
import { pollAgenceProductStatut, TEST_AGENCE_SLUG } from "../../e2e/helpers/supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

async function main(): Promise<void> {
  const { request } = await import("@playwright/test");
  const ctx = await request.newContext({ baseURL: BASE_URL });

  console.log("client dashboard API dry-run starting…");

  await cleanupSalesSession(ctx);
  await provisionSalesSession(ctx);

  const dashboard = await ctx.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
  assert.equal(dashboard.status(), 200);
  const dashboardBody = (await dashboard.json()) as {
    productStatut?: string;
    dashboardMode?: string;
    statut?: string;
  };
  assert.equal(dashboardBody.dashboardMode, "onboarding_preview");
  assert.equal(dashboardBody.statut, "MEETING_BOOKED");

  const skip = await ctx.post(`/api/dashboard/${TEST_AGENCE_SLUG}/dev-skip-payment`);
  assert.equal(skip.status(), 200);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

  await completeOnboardingApi(ctx, TEST_AGENCE_SLUG);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");

  const after = await ctx.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
  assert.equal(after.status(), 200);
  const afterBody = (await after.json()) as { productStatut?: string };
  assert.equal(afterBody.productStatut, "IN_DELIVERANCE");

  await cleanupSalesSession(ctx);
  console.log("client dashboard API dry-run passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
