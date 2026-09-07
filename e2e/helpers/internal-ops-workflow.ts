import { expect, type Page } from "@playwright/test";

import { TEST_AGENCE_EMAIL } from "./supabase-assertions";

const INTERNAL_HUB = "/internal";
const FUNNELS_LANDING = "/internal/funnels";
const AGENCE_HUB = "/internal/funnels/agence";
const BOOKINGS_PATH = "/internal/funnels/agence/bookings";

export async function runInternalHubNavigation(page: Page): Promise<void> {
  await page.goto(INTERNAL_HUB, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Internal" })).toBeVisible();

  await page.getByRole("link", { name: /Ouvrir Parcours/i }).click();
  await expect(page).toHaveURL(new RegExp(`${FUNNELS_LANDING}$`));

  await page.getByRole("link", { name: /Ouvrir Agence/i }).click();
  await expect(page).toHaveURL(new RegExp(`${AGENCE_HUB}$`));
  await expect(page.getByRole("link", { name: /Ouvrir Session/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ouvrir Bookings/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ouvrir Clients/i })).toBeVisible();
}

export async function runBookingsTableSmoke(page: Page): Promise<void> {
  const [bookingsRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/calendly/bookings?category=agence") &&
        response.request().method() === "GET",
      { timeout: 90_000 },
    ),
    page.goto(BOOKINGS_PATH, { waitUntil: "domcontentloaded" }),
  ]);
  expect(bookingsRes.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();

  const [refreshRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/calendly/bookings") &&
        response.request().method() === "GET",
    ),
    page.getByRole("button", { name: "Rafraîchir" }).click(),
  ]);
  expect(refreshRes.ok()).toBeTruthy();
  await expect(page.getByText(/\d+ rendez-vous/)).toBeVisible();
}

export async function assertTestBookingVisibleInTable(page: Page): Promise<void> {
  await page.goto(BOOKINGS_PATH, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Rafraîchir" }).click();
  await expect(page.getByText(TEST_AGENCE_EMAIL)).toBeVisible({ timeout: 30_000 });
}
