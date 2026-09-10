import { afterEach, describe, expect, it } from "vitest";

import {
  buildGlobalRules,
  DEFAULT_GROK_TEMPERATURE,
  resolveGrokTemperature,
} from "./grok";

describe("buildGlobalRules", () => {
  it("uses maximum sentence count instead of exact count", () => {
    const rules = buildGlobalRules(3);
    expect(rules).toContain(
      "Maximum 3 phrases courtes dans reply_text (hors signature et lien CTA).",
    );
    expect(rules).not.toContain("Écris exactement");
  });

  it("includes tone anti-patterns and drops forced urgency", () => {
    const rules = buildGlobalRules(2);
    expect(rules).toContain("pas d'urgence artificielle");
    expect(rules).toContain("Merci pour votre message");
    expect(rules).not.toContain("CTA urgent");
    expect(rules).not.toContain("accuser réception →");
  });
});

describe("resolveGrokTemperature", () => {
  const previous = process.env.GROK_TEMPERATURE;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.GROK_TEMPERATURE;
    } else {
      process.env.GROK_TEMPERATURE = previous;
    }
  });

  it("defaults to 0.5", () => {
    delete process.env.GROK_TEMPERATURE;
    expect(resolveGrokTemperature()).toBe(DEFAULT_GROK_TEMPERATURE);
  });

  it("clamps invalid values to default", () => {
    process.env.GROK_TEMPERATURE = "not-a-number";
    expect(resolveGrokTemperature()).toBe(DEFAULT_GROK_TEMPERATURE);
  });

  it("clamps out-of-range values", () => {
    process.env.GROK_TEMPERATURE = "2";
    expect(resolveGrokTemperature()).toBe(1);
    process.env.GROK_TEMPERATURE = "-1";
    expect(resolveGrokTemperature()).toBe(0);
  });
});
