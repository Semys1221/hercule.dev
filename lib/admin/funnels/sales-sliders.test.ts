/** Unit tests for Sliders presenter deck copy and gates. */

import assert from "node:assert/strict";

import {
  assertSlidersCanvasCopyHasNoTokens,
  canAdvanceFromSlidersStep,
  isSlidersSectionComplete,
  SLIDERS_STEP_IDS,
} from "@/lib/admin/funnels/sales-sliders";
import { getSalesQualificationDefaultValues } from "@/lib/admin/funnels/sales-qualification-schema";

function main() {
  assertSlidersCanvasCopyHasNoTokens();

  const defaults = getSalesQualificationDefaultValues("comptable");
  assert.equal(canAdvanceFromSlidersStep("s1_recap", defaults), true);
  assert.equal(canAdvanceFromSlidersStep("s6_capture", defaults), false);

  const captureReady = { ...defaults, sCaptureTied: true };
  assert.equal(canAdvanceFromSlidersStep("s6_capture", captureReady), true);

  const thinkMode = {
    ...defaults,
    sTempCheck: "think" as const,
    sThinkBeat1: true,
    sThinkBeat2: true,
    sThinkBeat3: false,
  };
  assert.equal(canAdvanceFromSlidersStep("s9_temp", thinkMode), false);

  const thinkComplete = {
    ...thinkMode,
    sThinkBeat3: true,
  };
  assert.equal(canAdvanceFromSlidersStep("s9_temp", thinkComplete), false);

  const tempYes = {
    ...defaults,
    sTempCheck: "yes" as const,
  };
  assert.equal(canAdvanceFromSlidersStep("s9_temp", tempYes), true);

  const incomplete = {
    ...defaults,
    sCaptureTied: true,
    sEngineTied: true,
    sPartnerTied: true,
    sTempCheck: "yes" as const,
  };
  assert.equal(isSlidersSectionComplete(incomplete), false);

  const complete = {
    ...incomplete,
    sOffer: "horizon" as const,
    sOfferCopiedAt: new Date().toISOString(),
  };
  assert.equal(isSlidersSectionComplete(complete), true);

  assert.equal(SLIDERS_STEP_IDS.length, 10);

  console.log("OK lib/admin/funnels/sales-sliders.test.ts");
}

main();
