import { describe, expect, it } from "vitest";

import { detectOptOut } from "./opt-out";

describe("detectOptOut", () => {
  it("detects explicit refusal", () => {
    expect(detectOptOut("Non merci, pas pour nous.")).toBe(true);
    expect(detectOptOut("STOP")).toBe(true);
    expect(detectOptOut("C'est mort pour nous.")).toBe(true);
  });

  it("does not treat non mais as opt-out", () => {
    expect(detectOptOut("Non mais je voudrais comprendre")).toBe(false);
  });

  it("ignores empty text", () => {
    expect(detectOptOut("")).toBe(false);
  });
});
