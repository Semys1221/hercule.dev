/**
 * API dry-run for retraction hold + waiver flows (agence seed).
 */
import assert from "node:assert/strict";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

import {
  cleanupSalesSession,
  provisionSalesSession,
  skipPayment,
} from "../../e2e/helpers/cockpit-fixture";
import { pollAgenceProductStatut, TEST_AGENCE_SLUG } from "../../e2e/helpers/supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

async function main(): Promise<void> {
  const { request } = await import("@playwright/test");
  const ctx = await request.newContext({ baseURL: BASE_URL });

  console.log("retraction waiver API dry-run starting…");

  await cleanupSalesSession(ctx);
  await provisionSalesSession(ctx);

  const skip = await ctx.post(`/api/dashboard/${TEST_AGENCE_SLUG}/dev-skip-payment`);
  assert.equal(skip.status(), 200);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

  const holdOnboarding = await ctx.patch(`/api/dashboard/${TEST_AGENCE_SLUG}`, {
    data: {
      form: { specialites: ["SEO"], zone: "Paris", capacite: 2 },
      completeOnboarding: true,
      cgvVersion: "2026-09-09",
      waiveRetraction: false,
    },
  });
  assert.equal(holdOnboarding.status(), 200);

  let statut = await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");
  assert.equal(statut, "PAID_PENDING_ONBOARDING");

  const holdDashboard = await ctx.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
  assert.equal(holdDashboard.status(), 200);
  const holdBody = (await holdDashboard.json()) as {
    retraction?: { status?: string; canWaive?: boolean };
    productStatut?: string;
  };
  assert.equal(holdBody.retraction?.status, "pending");
  assert.equal(holdBody.retraction?.canWaive, true);
  assert.notEqual(holdBody.productStatut, "IN_DELIVERANCE");

  const waiveResponse = await ctx.patch(`/api/dashboard/${TEST_AGENCE_SLUG}`, {
    data: { waiveRetraction: true },
  });
  assert.equal(waiveResponse.status(), 200);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");

  const activeDashboard = await ctx.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
  const activeBody = (await activeDashboard.json()) as {
    retraction?: { status?: string; canWaive?: boolean };
  };
  assert.equal(activeBody.retraction?.status, "waived");
  assert.equal(activeBody.retraction?.canWaive, false);

  await cleanupSalesSession(ctx);
  console.log("retraction waiver API dry-run passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
