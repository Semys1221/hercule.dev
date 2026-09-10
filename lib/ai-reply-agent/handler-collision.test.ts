import { describe, expect, it } from "vitest";

import { inboundLooksLikeQuestion } from "./inbound-question";

describe("collision guard follow-up bypass", () => {
  it("allows grok path for jomega eligibility follow-up after auto-reply", () => {
    const inbound = `Je n'ai pas 3 collaborateurs. Nous sommes 2 associés avec une partie sous-traités à un ami qui a aussi son cabinet.
C'est donc problématique d'après ce que vous me dites..`;

    expect(inboundLooksLikeQuestion(inbound)).toBe(true);
  });

  it("still blocks collision for short refusals without a question", () => {
    expect(inboundLooksLikeQuestion("non")).toBe(false);
    expect(inboundLooksLikeQuestion("NON.")).toBe(false);
  });
});
