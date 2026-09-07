import { expect, type Page } from "@playwright/test";

const TEST_CARD = {
  name: "Agence Test Hercule",
  number: "4242424242424242",
  expiry: "12/34",
  cvc: "123",
  zip: "75001",
};

export async function completeStripeEmbeddedCheckout(page: Page): Promise<void> {
  await expect(page.locator('iframe[name="embedded-checkout"]')).toBeVisible({ timeout: 60_000 });
  const checkout = page.frameLocator('iframe[name="embedded-checkout"]');
  await page.waitForTimeout(2000);

  const cardLabel = checkout.getByText(/^Card$/);
  if (await cardLabel.count()) {
    await cardLabel.first().click({ force: true });
    await page.waitForTimeout(1000);
  }

  const nameInput = checkout.getByPlaceholder(/full name on card/i);
  if (await nameInput.count()) {
    await nameInput.first().fill(TEST_CARD.name);
  }

  let filled = false;
  for (const frame of page.frames()) {
    try {
      const numberInput = frame.locator(
        'input[autocomplete="cc-number"], input[name="number"], input[placeholder*="1234"]',
      );
      if (!(await numberInput.count())) continue;

      await numberInput.first().fill(TEST_CARD.number);
      const expiryInput = frame.locator('input[autocomplete="cc-exp"], input[name="expiry"]');
      if (await expiryInput.count()) {
        await expiryInput.first().fill(TEST_CARD.expiry);
      }
      const cvcInput = frame.locator('input[autocomplete="cc-csc"], input[name="cvc"]');
      if (await cvcInput.count()) {
        await cvcInput.first().fill(TEST_CARD.cvc);
      }
      const zipInput = frame.locator('input[autocomplete="postal-code"], input[name="postalCode"]');
      if (await zipInput.count()) {
        await zipInput.first().fill(TEST_CARD.zip);
      }
      filled = true;
      break;
    } catch {
      // try next frame
    }
  }

  if (!filled) {
    const numberInput = checkout.locator(
      'input[autocomplete="cc-number"], input[name="number"], input[placeholder*="1234"]',
    );
    await numberInput.first().waitFor({ state: "visible", timeout: 30_000 });
    await numberInput.first().fill(TEST_CARD.number);
  }

  await checkout.getByRole("button", { name: /^Pay$/i }).click();
  await page.waitForURL(/paid=1/, { timeout: 90_000 });
}

export async function navigateToStripeCheckout(page: Page): Promise<void> {
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole("button", { name: "Suivant" }).click();
  }
  await page.getByRole("button", { name: "Procéder au paiement" }).click();
  await page.waitForTimeout(2000);
}

export async function enableDashboardDeveloperMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem("hercule:dashboard:developer-mode", "true");
  });
}
