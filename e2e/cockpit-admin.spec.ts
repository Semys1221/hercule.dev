import { test, expect } from "@playwright/test";

import {
  assertServerReachable,
  bootstrapDryRunClient,
  bootstrapLiveRunClient,
  cleanupSalesSession,
  provisionSalesSession,
  triggerBookingEmailsCron,
} from "./helpers/cockpit-fixture";
import {
  DASHBOARD_PATH,
  runClientsListSmoke,
  runCockpitWorkflow,
  submitAgenceSurvey,
} from "./helpers/cockpit-workflow";
import { assertResendEmailSent } from "./helpers/resend-inbox";
import { completeLivePayment } from "./helpers/live-payment";
import {
  enableDashboardDeveloperMode,
  navigateToStripeCheckout,
} from "./helpers/stripe-checkout";
import {
  getAgenceIdBySlug,
  pollAgenceProductStatut,
  pollPaymentSucceeded,
  TEST_AGENCE_EMAIL,
  TEST_AGENCE_SLUG,
} from "./helpers/supabase-assertions";

test.describe("@dry Cockpit admin E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.beforeEach(async ({ request }) => {
    await bootstrapDryRunClient(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("list page, bootstrap dashboard, and full cockpit workflow", async ({ page, request }) => {
    const dashboardResponse = await request.get(`/api/dashboard/${TEST_AGENCE_SLUG}`);
    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboard = (await dashboardResponse.json()) as { productStatut?: string };
    expect(dashboard.productStatut).toBe("IN_DELIVERANCE");

    await runCockpitWorkflow(page, request, { includeNoShow: true });
    await runClientsListSmoke(page, request);

    const refreshRes = await request.get(`/api/admin/clients/agence/${TEST_AGENCE_SLUG}`);
    expect(refreshRes.ok()).toBeTruthy();
    const payload = (await refreshRes.json()) as { productStatut?: string };
    expect(payload.productStatut).toBe("POST_RDV_SURVEY");
  });
});

test.describe("@live Cockpit admin E2E", () => {
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
    await bootstrapLiveRunClient(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("Stripe payment, onboarding UI, cockpit workflow, survey, and inbox", async ({
    page,
    request,
  }) => {
    await enableDashboardDeveloperMode(page);
    await page.goto(DASHBOARD_PATH);
    await navigateToStripeCheckout(page);
    await expect(page.locator('iframe[name="embedded-checkout"]')).toBeVisible({ timeout: 60_000 });

    await completeLivePayment(page, request);
    await pollPaymentSucceeded(TEST_AGENCE_SLUG);
    await pollAgenceProductStatut(TEST_AGENCE_SLUG, "PAID_PENDING_ONBOARDING");

    await page.goto(DASHBOARD_PATH);
    await page.getByRole("button", { name: "Compléter l'onboarding (test)" }).click();
    await pollAgenceProductStatut(TEST_AGENCE_SLUG, "IN_DELIVERANCE");

    await runClientsListSmoke(page, request);
    await runCockpitWorkflow(page, request, { includeNoShow: false });

    const agenceId = await getAgenceIdBySlug(TEST_AGENCE_SLUG);
    await submitAgenceSurvey(page, agenceId);

    await assertResendEmailSent(TEST_AGENCE_EMAIL, [
      "product_payment_welcome",
      "deliverance_search_started",
      "survey_rdv_agence",
    ]);

    await triggerBookingEmailsCron(request);

    // Unpaid client — cockpit Paiement tab + second Stripe checkout
    await cleanupSalesSession(request);
    await provisionSalesSession(request);
    await page.goto(`/internal/clients/agence/${TEST_AGENCE_SLUG}`);
    await page.getByRole("tab", { name: "Paiement" }).click();
    const checkoutResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/payments/checkout") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Créer le lien Stripe" }).click();
    const checkoutRes = await checkoutResponse;
    expect(checkoutRes.ok()).toBeTruthy();
    const checkoutBody = (await checkoutRes.json()) as { clientSecret?: string };
    expect(checkoutBody.clientSecret).toBeTruthy();

    await page.goto(DASHBOARD_PATH);
    await navigateToStripeCheckout(page);
    await expect(page.locator('iframe[name="embedded-checkout"]')).toBeVisible({ timeout: 60_000 });
    await completeLivePayment(page, request);
    await pollPaymentSucceeded(TEST_AGENCE_SLUG);
  });
});
