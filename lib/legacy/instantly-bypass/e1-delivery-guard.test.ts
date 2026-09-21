import { describe, expect, it } from "vitest";

import type { InterestedE1DeliveryState } from "./e1-thread-guard";

function shouldSkipInterestedE1Send(state: InterestedE1DeliveryState): boolean {
  return state.bypassSent && state.e1InThread;
}

describe("Interested E1 delivery guard", () => {
  it("skips only when bypass audit and Unibox thread both show E1", () => {
    expect(
      shouldSkipInterestedE1Send({
        bypassSent: true,
        e1InThread: true,
        delivered: true,
      }),
    ).toBe(true);
  });

  it("allows resend when bypass audit exists but E1 is missing in thread", () => {
    expect(
      shouldSkipInterestedE1Send({
        bypassSent: true,
        e1InThread: false,
        delivered: false,
      }),
    ).toBe(false);
  });

  it("allows first send when neither audit nor thread has E1", () => {
    expect(
      shouldSkipInterestedE1Send({
        bypassSent: false,
        e1InThread: false,
        delivered: false,
      }),
    ).toBe(false);
  });
});
