import { expect, type APIRequestContext, type Page } from "@playwright/test";

import {
  advancePreviewWizardToCheckout,
  enableDashboardDeveloperMode,
  navigateToStripeCheckout,
} from "./stripe-checkout";
import { completeLivePayment } from "./live-payment";
import {
  pollAgenceProductStatut,
  pollPaymentSucceeded,
  TEST_AGENCE_SLUG,
} from "./supabase-assertions";

export const DASHBOARD_PATH = `/dashboard/${TEST_AGENCE_SLUG}`;

export async function runPreviewWizardToCheckout(page: Page): Promise<void> {
  await enableDashboardDeveloperMode(page);
  const [dashboardRes] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
        response.request().method() === "GET",
    ),
    page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" }),
  ]);
  expect(dashboardRes.ok()).toBeTruthy();
  const body = (await dashboardRes.json()) as {
    productStatut?: string;
    dashboardMode?: string;
    statut?: string;
  };
  expect(body.dashboardMode).toBe("onboarding_preview");
  expect(body.statut).toBe("MEETING_BOOKED");

  await advancePreviewWizardToCheckout(page);
  await expect(page.locator('iframe[name="embedded-checkout"]')).toBeVisible({ timeout: 60_000 });
}

export async function runDryPaymentAndOnboarding(page: Page): Promise<void> {
  await enableDashboardDeveloperMode(page);
  await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
  await navigateToStripeCheckout(page);

  const skipResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/dev-skip-payment") && response.request().method() === "POST",
  );
  const dashboardRefresh = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
      response.request().method() === "GET",
  );
  await page.getByRole("button", { name: "Simuler le paiement" }).click();
  expect((await skipResponse).ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");
  await dashboardRefresh;

  const onboardingButton = page.getByRole("button", {
    name: "Compléter l'onboarding (test)",
  });
  await expect(onboardingButton).toBeVisible({ timeout: 30_000 });

  const onboardingResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
      response.request().method() === "PATCH",
  );
  await onboardingButton.click();
  const patchRes = await onboardingResponse;
  if (!patchRes.ok()) {
    throw new Error(`onboarding PATCH failed: ${patchRes.status()} ${await patchRes.text()}`);
  }
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");
}

export async function runLivePaymentAndOnboarding(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  await enableDashboardDeveloperMode(page);
  await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
  await navigateToStripeCheckout(page);
  await expect(page.locator('iframe[name="embedded-checkout"]')).toBeVisible({ timeout: 60_000 });

  await completeLivePayment(page, request);
  await pollPaymentSucceeded(TEST_AGENCE_SLUG);
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

  await page.goto(DASHBOARD_PATH);
  const onboardingResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Compléter l'onboarding (test)" }).click();
  expect((await onboardingResponse).ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");
}

export async function runDryPaymentRetractionHold(page: Page): Promise<void> {
  await enableDashboardDeveloperMode(page);
  await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
  await navigateToStripeCheckout(page);

  const skipResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/dev-skip-payment") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Simuler le paiement" }).click();
  expect((await skipResponse).ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

  const holdOnboarding = await page.request.patch(`/api/dashboard/${TEST_AGENCE_SLUG}`, {
    data: {
      form: { specialites: ["SEO"], zone: "Paris", capacite: 2 },
      completeOnboarding: true,
      cgvVersion: "2026-09-09",
      waiveRetraction: false,
    },
  });
  expect(holdOnboarding.ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

  await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Démarrer maintenant" })).toBeVisible({
    timeout: 30_000,
  });

  const waiveResponse = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/dashboard/${TEST_AGENCE_SLUG}`) &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Démarrer maintenant" }).click();
  expect((await waiveResponse).ok()).toBeTruthy();
  await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");
}

export async function assertActiveDashboardUi(page: Page): Promise<void> {
  await page.goto(DASHBOARD_PATH, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Chronologie/i }).or(
      page.getByText(/chronologie|livraison|timeline|Suivi de votre parcours/i).first(),
    ),
  ).toBeVisible({
    timeout: 30_000,
  });
}
