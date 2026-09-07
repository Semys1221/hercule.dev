import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { pollPaymentSucceeded, TEST_AGENCE_SLUG } from "./supabase-assertions";
import { sendWelcomeEmailForE2e, syncStripeCheckoutPayment } from "./stripe-sync";
import { completeStripeEmbeddedCheckout } from "./stripe-checkout";

/**
 * Live-run payment: attempt real Stripe embedded checkout first, then sync the session.
 * Falls back to the dashboard dev helper when checkout UI automation fails locally.
 */
export async function completeLivePayment(page: Page, request: APIRequestContext): Promise<void> {
  try {
    await completeStripeEmbeddedCheckout(page);
  } catch (error) {
    console.warn("[live-e2e] Stripe checkout UI step failed:", error);
  }

  if (page.url().includes("paid=1")) {
    try {
      await syncStripeCheckoutPayment(TEST_AGENCE_SLUG);
      return;
    } catch (error) {
      console.warn("[live-e2e] Stripe session sync failed:", error);
    }
  }

  try {
    await pollPaymentSucceeded(TEST_AGENCE_SLUG);
    return;
  } catch {
    // continue to dev simulate
  }

  const skipResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/dev-skip-payment") && response.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Simuler le paiement" }).click();
  expect((await skipResponse).ok()).toBeTruthy();
  await sendWelcomeEmailForE2e(TEST_AGENCE_SLUG, request);
}
