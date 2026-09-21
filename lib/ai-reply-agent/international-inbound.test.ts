import { describe, expect, it } from "vitest";

import {
  canIssueInternational1to1Link,
  inboundExplicitlyAcceptsInternationalPricing,
  inboundLooksLikeInternationalGeoQuestion,
  inboundLooksLikeInternationalLead,
  threadMentionedInternationalPricing,
} from "./international-inbound";

describe("international inbound detection", () => {
  it("detects Belgian email domain", () => {
    expect(
      inboundLooksLikeInternationalLead(
        "Bonjour",
        "achraf@duxcompta.be",
      ),
    ).toBe(true);
  });

  it("detects Belgium geo question", () => {
    const text =
      "A première vu le site répertorie des annonces pour la France non ? Cela concerne aussi la Belgique ?";
    expect(
      inboundLooksLikeInternationalGeoQuestion(text, "achraf@duxcompta.be"),
    ).toBe(true);
  });

  it("accepts explicit pricing confirmation", () => {
    expect(
      inboundExplicitlyAcceptsInternationalPricing(
        "J'accepte les tarifications et souhaite échanger.",
      ),
    ).toBe(true);
  });

  it("rejects exchange without pricing acceptance", () => {
    expect(
      inboundExplicitlyAcceptsInternationalPricing(
        "Je souhaite échanger avec plaisir.",
      ),
    ).toBe(false);
  });

  it("detects international pricing in thread", () => {
    const thread =
      "Effectivement notre modèle par défaut est pour la France. Tarif Hercule 1 499 USD/mois. Acceptez ces tarifications.";
    expect(threadMentionedInternationalPricing(thread)).toBe(true);
  });

  it("issues 1:1 link only with thread pricing and explicit acceptance", () => {
    const thread =
      "Pour la Belgique : 1 499 USD/mois et 400 USD/mois par profil. Acceptez ces tarifications.";
    expect(
      canIssueInternational1to1Link({
        inboundText: "J'accepte les tarifications.",
        threadContext: thread,
      }),
    ).toBe(true);
    expect(
      canIssueInternational1to1Link({
        inboundText: "Je souhaite échanger.",
        threadContext: thread,
      }),
    ).toBe(false);
  });
});
