/** Unit tests for payment onboarding sequence markdown files. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PAYMENT_ONBOARDING_EMAIL_TYPES, PAYMENT_ONBOARDING_VERTICALS } from "./constants";
import { PAYMENT_ONBOARDING_MARKDOWN } from "./sequence-sources";
import { readPaymentOnboardingSequence } from "./sequences";

function main() {
  const onboardingDir = join(process.cwd(), "lib/(resend)/onboarding");
  for (const vertical of PAYMENT_ONBOARDING_VERTICALS) {
    const disk = readFileSync(join(onboardingDir, `${vertical}.md`), "utf-8");
    assert.equal(
      PAYMENT_ONBOARDING_MARKDOWN[vertical],
      disk,
      `sequence-sources.ts out of sync with ${vertical}.md — regenerate sources`,
    );

    const doc = readPaymentOnboardingSequence(vertical);
    assert.equal(doc.slug, "payment-onboarding");
    assert.equal(doc.vertical, vertical);
    assert.equal(doc.stopOnReply, false);
    assert.deepEqual(doc.stopTriggers, []);
    assert.equal(doc.steps.length, 9);

    for (let index = 0; index < doc.steps.length; index += 1) {
      const step = doc.steps[index];
      assert.equal(step.emailType, PAYMENT_ONBOARDING_EMAIL_TYPES[index]);
      assert.ok(step.subject.trim().length > 0, `missing subject step ${index + 1}`);
      assert.ok(step.body.trim().length > 0, `missing body step ${index + 1}`);
      assert.ok(
        step.body.includes("{{dashboardLink}}"),
        `${vertical} step ${index + 1} must include {{dashboardLink}}`,
      );
      assert.ok(
        !step.body.includes("{{firstNameLine}}"),
        `firstNameLine must not appear in ${vertical} step ${index + 1}`,
      );
      assert.ok(
        !step.body.includes("Courtage en projet BNC/BIC/TNS"),
        `signature must not be inlined in ${vertical} step ${index + 1}`,
      );
    }
  }

  console.log("sequences.test.ts: ok");
}

main();
