import { expect, type Page } from "@playwright/test";

import { TEST_AGENCE_EMAIL } from "./supabase-assertions";

const INTERNAL_HUB = "/internal";
const FUNNELS_LANDING = "/internal/funnels";
const AGENCE_HUB = "/internal/funnels/agence";
const BOOKINGS_PATH = "/internal/funnels/agence/bookings";

export async function runInternalHubNavigation(page: Page): Promise<void> {
  await page.goto(INTERNAL_HUB, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

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

const CLIENTS_PATH = "/internal/funnels/agence/clients";

export async function assertProvisionedTestClientVisible(page: Page): Promise<void> {
  const [clientsRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/clients?category=agence") &&
        response.request().method() === "GET",
      { timeout: 90_000 },
    ),
    page.goto(CLIENTS_PATH, { waitUntil: "domcontentloaded" }),
  ]);
  expect(clientsRes.ok()).toBeTruthy();
  await expect(page.getByRole("cell", { name: new RegExp(TEST_AGENCE_EMAIL, "i") })).toBeVisible({
    timeout: 30_000,
  });
}
