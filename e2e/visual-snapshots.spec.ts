import { test, expect } from "@playwright/test";

import { assertServerReachable } from "./helpers/cockpit-fixture";
import { enableDashboardDeveloperMode } from "./helpers/stripe-checkout";
import { TEST_AGENCE_SLUG } from "./helpers/supabase-assertions";

const CLIENTS_LIST = "/internal/funnels/agence/clients";
const DASHBOARD_HUB = `/dashboard/${TEST_AGENCE_SLUG}`;

test.describe("@visual Visual regression snapshots", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("internal admin hub", async ({ page }) => {
    await page.goto("/internal", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page).toHaveScreenshot("internal-hub.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("internal clients list", async ({ page }) => {
    const [clientsRes] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/clients?category=agence") &&
          response.request().method() === "GET",
        { timeout: 90_000 },
      ),
      page.goto(CLIENTS_LIST, { waitUntil: "domcontentloaded" }),
    ]);
    expect(clientsRes.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(page).toHaveScreenshot("internal-clients.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("marketing home", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    await expect(page).toHaveScreenshot("marketing-home.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });

  test("client dashboard hub (preview)", async ({ page }) => {
    await enableDashboardDeveloperMode(page);
    const [dashboardRes] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
          response.request().method() === "GET",
        { timeout: 90_000 },
      ),
      page.goto(DASHBOARD_HUB, { waitUntil: "domcontentloaded" }),
    ]);
    expect(dashboardRes.ok()).toBeTruthy();
    await expect(page).toHaveScreenshot("dashboard-hub.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.03,
    });
  });
});
