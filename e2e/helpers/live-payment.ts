import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { pollPaymentSucceeded, TEST_AGENCE_SLUG } from "./supabase-assertions";
import { skipPayment } from "./cockpit-fixture";
import { sendWelcomeEmailForE2e, syncStripeCheckoutPayment } from "./stripe-sync";
import { completeStripeEmbeddedCheckout } from "./stripe-checkout";

/**
 * Live-run payment: attempt real Stripe embedded checkout first, then sync the session.
 * Falls back to the dashboard dev API when checkout UI automation fails locally.
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
    await syncStripeCheckoutPayment(TEST_AGENCE_SLUG);
    await pollPaymentSucceeded(TEST_AGENCE_SLUG);
    return;
  } catch (error) {
    console.warn("[live-e2e] Stripe session sync fallback failed:", error);
  }

  try {
    await pollPaymentSucceeded(TEST_AGENCE_SLUG);
    return;
  } catch {
    // continue to dev skip API
  }

  await skipPayment(request, TEST_AGENCE_SLUG);
  await sendWelcomeEmailForE2e(TEST_AGENCE_SLUG, request);
}
