import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { SESSION_PREPARATION_SAVE_SUCCESS } from "@/lib/admin/funnels/ui-copy";

import { TEST_AGENCE_EMAIL } from "./supabase-assertions";

export const SALES_HUB_PATH = "/internal/funnels/agence/sales";
export const SALES_FUNNEL_PATH = "/internal/funnels/agence/sales/funnel";
export const SALES_SETTINGS_PATH = "/internal/funnels/agence/sales/funnel/settings";

export async function openSalesSessionFromHub(page: Page): Promise<void> {
  await page.goto(SALES_HUB_PATH, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Ouvrir la session" }).click();
  await expect(page).toHaveURL(new RegExp(`${SALES_FUNNEL_PATH}$`));
  await expect(page.getByRole("link", { name: "Quitter la session" })).toBeVisible();
}

export async function provisionTestMeetingInSession(page: Page): Promise<void> {
  const [testRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/sales-funnel/test-meeting") &&
        response.request().method() === "POST",
      { timeout: 90_000 },
    ),
    page.getByRole("button", { name: "Test" }).click(),
  ]);
  expect(testRes.ok()).toBeTruthy();
  await expect(page.getByText(TEST_AGENCE_EMAIL).first()).toBeVisible({
    timeout: 30_000,
  });
}

export async function navigateQualificationSections(page: Page): Promise<void> {
  for (const label of [
    "Audit de compatibilité",
    "Présentation de la société",
    "Conditions commerciales",
  ]) {
    await page.getByRole("button", { name: label }).click();
    await expect(page.getByRole("heading", { name: new RegExp(label.split(" ")[0], "i") }).first()).toBeVisible();
  }
}

export async function runClosingWorkflow(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Passer aux étapes" }).click();
  await page.getByRole("button", { name: "Récapitulatif" }).click();
  await expect(page.getByRole("heading", { name: /récapitulatif/i })).toBeVisible();

  await page.getByRole("button", { name: "Règles de traitement" }).click();
  const reglesPatch = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/sales-calls/") &&
      response.request().method() === "PATCH",
  );
  await page.getByLabel(/règles de traitement Hercule/i).click();
  expect((await reglesPatch).ok()).toBeTruthy();

  await page.getByRole("button", { name: "Opportunités éligibles" }).click();
  await expect(page.getByText(/sélectionnée|sélectionnées/i).first()).toBeVisible({
    timeout: 60_000,
  });

  await page.getByRole("button", { name: "Calendrier de collaboration" }).click();
  const calendrierCheckbox = page.getByLabel(/Calendrier susceptible/i);
  await expect(calendrierCheckbox).toBeVisible({ timeout: 90_000 });
  const [calendrierRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/sales-calls/") &&
        response.request().method() === "PATCH",
    ),
    calendrierCheckbox.click(),
  ]);
  expect(calendrierRes.ok()).toBeTruthy();

  await page.getByRole("button", { name: "Lien dashboard" }).click();
  await expect(page.getByRole("button", { name: "Copier le lien" })).toBeVisible();
  await page.getByRole("button", { name: "Copier le lien" }).click();
  await expect(page.getByRole("button", { name: "Copié" })).toBeVisible();
}

export async function runSalesSettingsWorkflow(page: Page): Promise<void> {
  await page.goto(SALES_SETTINGS_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /réglages de la session/i })).toBeVisible();

  const settingsGet = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/sales-session-settings/agence") &&
      response.request().method() === "GET",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  expect((await settingsGet).ok()).toBeTruthy();

  const waitingToggle = page.locator("#waiting-queue-toggle");
  if (await waitingToggle.isVisible()) {
    const [putRes] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/admin/sales-session-settings/agence") &&
          response.request().method() === "PUT",
        { timeout: 30_000 },
      ),
      waitingToggle.click(),
    ]);
    expect(putRes.ok()).toBeTruthy();
  }

  await page.getByRole("tab", { name: "Préparation" }).click();
  const note = `E2E preparation ${Date.now()}`;
  await page.locator("#preparation-content").fill(note);

  const [saveRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/sales-session-settings/agence") &&
        response.request().method() === "PUT",
    ),
    page.getByRole("button", { name: "Enregistrer" }).click(),
  ]);
  expect(saveRes.ok()).toBeTruthy();
  await expect(page.getByText(SESSION_PREPARATION_SAVE_SUCCESS)).toBeVisible();
}

export async function fetchCalendlyBookingsInSession(page: Page): Promise<boolean> {
  const [bookingsRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/calendly/bookings") &&
        response.request().method() === "GET",
      { timeout: 60_000 },
    ),
    page.getByRole("button", { name: "Récupérer les rendez-vous" }).click(),
  ]);
  return bookingsRes.ok();
}
