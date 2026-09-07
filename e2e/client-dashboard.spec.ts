import { test, expect } from "@playwright/test";

import {
  assertServerReachable,
  cleanupSalesSession,
  provisionSalesSession,
} from "./helpers/cockpit-fixture";
import {
  assertActiveDashboardUi,
  runDryPaymentAndOnboarding,
  runLivePaymentAndOnboarding,
  runPreviewWizardToCheckout,
} from "./helpers/client-dashboard-workflow";
import { assertResendEmailSent } from "./helpers/resend-inbox";
import { pollAgenceProductStatut, TEST_AGENCE_EMAIL, TEST_AGENCE_SLUG } from "./helpers/supabase-assertions";

test.describe("@dashboard-dry Client dashboard E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ request }) => {
    await cleanupSalesSession(request);
    await provisionSalesSession(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("preview wizard, dev-skip payment, and complete onboarding", async ({ page }) => {
    await runPreviewWizardToCheckout(page);
    await runDryPaymentAndOnboarding(page);
    await assertActiveDashboardUi(page);

    const refreshRes = await page.request.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
    expect(refreshRes.ok()).toBeTruthy();
    const payload = (await refreshRes.json()) as { productStatut?: string };
    expect(payload.productStatut).toBe("IN_DELIVERANCE");
  });
});

test.describe("@dashboard-live Client dashboard E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      test.skip(true, "STRIPE_SECRET_KEY is required for live run");
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
      test.skip(true, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required for live run");
    }
    if (!process.env.RESEND_API_KEY?.trim()) {
      test.skip(true, "RESEND_API_KEY is required for live inbox verification");
    }
  });

  test.beforeEach(async ({ request }) => {
    await cleanupSalesSession(request);
    await provisionSalesSession(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("Stripe payment, onboarding, and welcome email", async ({ page, request }) => {
    await runLivePaymentAndOnboarding(page, request);
    await assertActiveDashboardUi(page);
    await assertResendEmailSent(TEST_AGENCE_EMAIL, ["product_payment_welcome"]);
    await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");
  });
});
