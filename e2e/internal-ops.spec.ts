import { test } from "@playwright/test";

import { assertServerReachable, cleanupSalesSession, provisionSalesSession } from "./helpers/cockpit-fixture";
import {
  assertTestBookingVisibleInTable,
  runBookingsTableSmoke,
  runInternalHubNavigation,
} from "./helpers/internal-ops-workflow";

test.describe("@internal-ops Internal hub and bookings E2E", () => {
  test.beforeAll(async ({ request }) => {
    await assertServerReachable(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupSalesSession(request);
  });

  test("hub navigation, bookings table, and test session row", async ({ page, request }) => {
    await runInternalHubNavigation(page);
    await runBookingsTableSmoke(page);

    await provisionSalesSession(request);
    await assertTestBookingVisibleInTable(page);
  });
});
