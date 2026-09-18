import { describe, expect, it } from "vitest";

import { inboundNeedsFollowUp } from "./inbound-question";

describe("collision guard follow-up bypass", () => {
  it("allows grok path for jomega eligibility follow-up after auto-reply", () => {
    const inbound = `Je n'ai pas 3 collaborateurs. Nous sommes 2 associés avec une partie sous-traités à un ami qui a aussi son cabinet.
C'est donc problématique d'après ce que vous me dites..`;

    expect(inboundNeedsFollowUp(inbound)).toBe(true);
  });

  it("still blocks collision for short refusals without a question", () => {
    expect(inboundNeedsFollowUp("non")).toBe(false);
    expect(inboundNeedsFollowUp("NON.")).toBe(false);
  });

  it("allows grok path for conference link follow-up after auto-reply", () => {
    const inbound =
      "Bjr je veux juste de lien de connection de mercredi prochain\nMerci\nCrdt";
    expect(inboundNeedsFollowUp(inbound)).toBe(true);
  });

  it("allows grok path when lead shares a phone number", () => {
    const inbound =
      "Je vous invite à me contacter au 07 80 99 48 70.\n\nMr BERCHER frederic";
    expect(inboundNeedsFollowUp(inbound)).toBe(true);
  });

  it("allows grok path for interest signals after E1", () => {
    expect(
      inboundNeedsFollowUp("Bonsoir Je peut être intéressé. Envoyé de mon iPhone"),
    ).toBe(true);
  });

  it("allows grok path for scheduling answers after E1", () => {
    expect(inboundNeedsFollowUp("Jeudi 15h ou vendredi 16h")).toBe(true);
  });

  it("allows grok path for identity verification requests", () => {
    const inbound = `Bonjour Madame Meyer,
Votre message ne comporte pas d'en-tête ni de coordonnées permettant
d'identifier clairement la société que vous représenter.
Pouvez-vous me communiquer le nom complet de votre société ?`;
    expect(inboundNeedsFollowUp(inbound)).toBe(true);
  });
});
