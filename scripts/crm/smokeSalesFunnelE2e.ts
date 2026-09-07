/**
 * API-level dry run for sales funnel endpoints (no browser).
 */
import assert from "node:assert/strict";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

import {
  cleanupSalesSession,
  provisionSalesSession,
} from "../../e2e/helpers/cockpit-fixture";
import {
  assertSalesCallPersisted,
  assertAgenceMeetingBooked,
} from "../../e2e/helpers/sales-funnel-fixture";
import {
  getAgenceIdBySlug,
  TEST_AGENCE_EMAIL,
  TEST_AGENCE_SLUG,
} from "../../e2e/helpers/supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

async function main(): Promise<void> {
  const { request } = await import("@playwright/test");
  const ctx = await request.newContext({ baseURL: BASE_URL });

  console.log("sales funnel API dry-run starting…");

  await cleanupSalesSession(ctx);
  await provisionSalesSession(ctx);
  await assertAgenceMeetingBooked(TEST_AGENCE_SLUG);

  const agenceId = await getAgenceIdBySlug(TEST_AGENCE_SLUG);
  const leadRes = await ctx.get(`/api/admin/leads/${agenceId}?category=agence`);
  assert.equal(leadRes.status(), 200);

  const salesCallRes = await ctx.post("/api/admin/sales-calls", {
    data: {
      agenceId,
      email: TEST_AGENCE_EMAIL,
      inviteeUri: "https://api.calendly.com/scheduled_events/test-session/invitees/sales-funnel-smoke",
      scheduledAt: new Date().toISOString(),
    },
  });
  assert.equal(salesCallRes.status(), 200);
  const salesCallBody = (await salesCallRes.json()) as { salesCall?: { id?: string } };
  const salesCallId = salesCallBody.salesCall?.id;
  assert.ok(salesCallId, "sales call id expected");

  const patchQual = await ctx.patch(`/api/admin/sales-calls/${salesCallId}`, {
    data: {
      qualification: { introConfirmed: true, presentationConfirmed: true, q1: ["google_ads"] },
    },
  });
  assert.equal(patchQual.status(), 200);

  const patchClosing = await ctx.patch(`/api/admin/sales-calls/${salesCallId}`, {
    data: { closing: { reglesAccepted: true, calendrierAccepted: true } },
  });
  assert.equal(patchClosing.status(), 200);
  await assertSalesCallPersisted(TEST_AGENCE_SLUG);

  const settingsGet = await ctx.get("/api/admin/sales-session-settings/agence");
  assert.equal(settingsGet.status(), 200);
  const settingsBody = (await settingsGet.json()) as { document?: Record<string, unknown> };
  assert.ok(settingsBody.document);

  const settingsPut = await ctx.put("/api/admin/sales-session-settings/agence", {
    data: {
      ...settingsBody.document,
      waitingQueueEnabled: true,
      preparationContent: "smoke test note",
    },
  });
  assert.equal(settingsPut.status(), 200);

  const bookings = await ctx.get("/api/admin/calendly/bookings?category=agence", {
    timeout: 120_000,
  });
  assert.equal(bookings.status(), 200);

  await cleanupSalesSession(ctx);
  console.log("sales funnel API dry-run passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
