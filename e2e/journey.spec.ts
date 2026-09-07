import { test, expect } from "@playwright/test";

import { assertServerReachable, cleanupSalesSession } from "./helpers/cockpit-fixture";
import { runDryPaymentAndOnboarding, DASHBOARD_PATH } from "./helpers/client-dashboard-workflow";
import {
  assertAgenceMeetingBooked,
  enableSalesDeveloperMode,
} from "./helpers/sales-funnel-fixture";
import {
  openSalesSessionFromHub,
  provisionTestMeetingInSession,
  runClosingWorkflow,
} from "./helpers/sales-funnel-workflow";
import { pollAgenceProductStatut, TEST_AGENCE_SLUG } from "./helpers/supabase-assertions";
import { enableDashboardDeveloperMode } from "./helpers/stripe-checkout";

const COCKPIT_PATH = `/internal/clients/agence/${TEST_AGENCE_SLUG}`;

test.describe("@journey Sales to dashboard to cockpit handoff", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ page }) => {
    await enableSalesDeveloperMode(page);
    await enableDashboardDeveloperMode(page);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("test meeting, closing, client onboarding, cockpit IN_DELIVERANCE", async ({ page }) => {
    await openSalesSessionFromHub(page);
    await provisionTestMeetingInSession(page);
    await runClosingWorkflow(page);
    await assertAgenceMeetingBooked();

    await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
    await runDryPaymentAndOnboarding(page);
    await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");

    const [cockpitRes] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/admin/clients/agence/${TEST_AGENCE_SLUG}`) &&
          response.request().method() === "GET",
      ),
      page.goto(COCKPIT_PATH, { waitUntil: "domcontentloaded" }),
    ]);
    expect(cockpitRes.ok()).toBeTruthy();

    await page.getByRole("tab", { name: "État" }).click();
    await expect(page.getByText(/IN_DELIVERANCE|En délivrance/i)).toBeVisible();
  });
});
