import { test, expect } from "@playwright/test";

import { assertServerReachable, cleanupSalesSession, provisionSalesSession } from "./helpers/cockpit-fixture";
import {
  assertAgenceMeetingBooked,
  assertSalesCallPersisted,
  enableSalesDeveloperMode,
} from "./helpers/sales-funnel-fixture";
import {
  fetchCalendlyBookingsInSession,
  openSalesSessionFromHub,
  provisionTestMeetingInSession,
  runClosingWorkflow,
  runSalesSettingsWorkflow,
  SALES_FUNNEL_PATH,
} from "./helpers/sales-funnel-workflow";

test.describe("@sales-dry Sales funnel E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ page, request }) => {
    await cleanupSalesSession(request);
    await enableSalesDeveloperMode(page);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("hub, test meeting, closing flow, settings, and DB persistence", async ({ page }) => {
    await openSalesSessionFromHub(page);
    await provisionTestMeetingInSession(page);
    await runClosingWorkflow(page);
    await assertAgenceMeetingBooked();
    await assertSalesCallPersisted();

    await runSalesSettingsWorkflow(page);
    await page.getByRole("link", { name: "Retour à la session" }).last().click();
    await expect(page).toHaveURL(new RegExp(`${SALES_FUNNEL_PATH}$`));
  });
});

test.describe("@sales-live Sales funnel E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ page, request }) => {
    await cleanupSalesSession(request);
    await enableSalesDeveloperMode(page);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("Calendly bookings fetch and settings persistence on reload", async ({ page, request }) => {
    await provisionSalesSession(request);
    await page.goto(SALES_FUNNEL_PATH, { waitUntil: "domcontentloaded" });
    const ok = await fetchCalendlyBookingsInSession(page);
    expect(ok).toBeTruthy();

    await runSalesSettingsWorkflow(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: "Préparation" })).toBeVisible();
  });
});
