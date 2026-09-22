/** Unit tests for payment onboarding orchestration helpers. */

import assert from "node:assert/strict";

import {
  defaultUseHtml,
  signatureTaglineForEmail,
} from "@/lib/(resend)/communication/signatures";

import {
  PAYMENT_ONBOARDING_EMAIL_TYPES,
  PAYMENT_ONBOARDING_SIGNATURE_TAGLINE,
} from "./constants";
import { estimateFirstRdvDateLabel } from "./estimate-rdv-date";
import { parisWallTime } from "./paris-time";
import {
  isPaymentOnboardingOwner,
  leadCategoryFromOwner,
  resolveVerticalFromOwner,
} from "./resolve-vertical";

function main() {
  assert.equal(resolveVerticalFromOwner("comptable"), "dec");
  assert.equal(resolveVerticalFromOwner("cif"), "cif");
  assert.equal(resolveVerticalFromOwner("entreprise"), "ias");
  assert.equal(leadCategoryFromOwner("comptable"), "comptable");
  assert.equal(leadCategoryFromOwner("cif"), "cif");
  assert.equal(leadCategoryFromOwner("entreprise"), "entreprise");
  assert.equal(isPaymentOnboardingOwner("comptable"), true);
  assert.equal(isPaymentOnboardingOwner("cif"), true);
  assert.equal(isPaymentOnboardingOwner("entreprise"), true);

  const label = estimateFirstRdvDateLabel(new Date("2026-09-01T10:00:00.000Z"));
  assert.match(label, /\d{1,2}/);
  assert.match(label, /2026/);

  const paymentAt = new Date("2026-09-21T08:00:00.000Z");
  const slot = parisWallTime(paymentAt, 17, 0);
  const hourParis = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(slot),
  );
  assert.equal(hourParis, 17);
  assert.ok(slot.getTime() >= paymentAt.getTime());

  for (const emailType of PAYMENT_ONBOARDING_EMAIL_TYPES) {
    assert.equal(defaultUseHtml(emailType), false);
    assert.equal(
      signatureTaglineForEmail("comptable", emailType),
      PAYMENT_ONBOARDING_SIGNATURE_TAGLINE,
    );
    assert.equal(
      signatureTaglineForEmail("cif", emailType),
      PAYMENT_ONBOARDING_SIGNATURE_TAGLINE,
    );
    assert.equal(
      signatureTaglineForEmail("entreprise", emailType),
      PAYMENT_ONBOARDING_SIGNATURE_TAGLINE,
    );
  }

  console.log("orchestrator.test.ts: ok");
}

main();
