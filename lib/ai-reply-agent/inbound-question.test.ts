import { describe, expect, it } from "vitest";

import {
  inboundLooksLikePhoneRequest,
  inboundLooksLikeQuestion,
  inboundLooksLikeSchedulingAnswer,
  inboundNeedsFollowUp,
  inboundProvidesPhoneNumber,
  inboundRequestsVerification,
  inboundShowsInterest,
} from "./inbound-question";

describe("inboundLooksLikeQuestion", () => {
  it("returns false for empty bodies", () => {
    expect(inboundLooksLikeQuestion("")).toBe(false);
    expect(inboundLooksLikeQuestion("(empty body)")).toBe(false);
  });

  it("detects explicit question marks before quoted thread", () => {
    const text = `Je n'ai pas 3 collaborateurs. C'est problématique ?

Le jeu. 10 sept. 2026, Béatrice Meyer a écrit :
> Merci pour votre message`;
    expect(inboundLooksLikeQuestion(text)).toBe(true);
  });

  it("detects eligibility keywords without question mark", () => {
    const text =
      "Je n'ai pas 3 collaborateurs. Nous sommes 2 associés avec une partie sous-traitée.";
    expect(inboundLooksLikeQuestion(text)).toBe(true);
  });

  it("detects pricing explanation requests", () => {
    expect(
      inboundLooksLikeQuestion("Pouvez vous m'expliquer cette phrase svp?"),
    ).toBe(true);
  });

  it("returns false for short refusals", () => {
    expect(inboundLooksLikeQuestion("NON.")).toBe(false);
    expect(inboundLooksLikeQuestion("non")).toBe(false);
    expect(inboundLooksLikeQuestion("Ça n'est pas mon cas")).toBe(false);
  });

  it("detects phone requests", () => {
    expect(
      inboundLooksLikeQuestion(
        "Nous ne remplirons pas de formulaire en ligne, joignez-nous par téléphone",
      ),
    ).toBe(true);
  });

  it("detects conference connection link requests without question mark", () => {
    expect(
      inboundLooksLikeQuestion(
        "Bjr je veux juste de lien de connection de mercredi prochain\nMerci\nCrdt",
      ),
    ).toBe(true);
  });

  it("detects missing link follow-ups", () => {
    expect(
      inboundLooksLikeQuestion("Ok mais je n'ai pas de lien de connection (?)"),
    ).toBe(true);
  });
});

describe("inboundLooksLikePhoneRequest", () => {
  it("detects cabinet.cbce-style phone refusal", () => {
    expect(
      inboundLooksLikePhoneRequest(
        "Nous ne remplirons pas de formulaire en ligne, joignez-nous par téléphone",
      ),
    ).toBe(true);
  });

  it("returns false for scheduling answers", () => {
    expect(inboundLooksLikePhoneRequest("Je suis disponible mardi 14h")).toBe(
      false,
    );
  });
});

describe("inboundProvidesPhoneNumber", () => {
  it("detects spaced French mobile numbers", () => {
    expect(
      inboundProvidesPhoneNumber("Je vous invite à me contacter au 07 80 99 48 70."),
    ).toBe(true);
  });

  it("returns false without a phone number", () => {
    expect(inboundProvidesPhoneNumber("Merci pour votre message")).toBe(false);
  });
});

describe("inboundShowsInterest", () => {
  it("detects interest keywords", () => {
    expect(inboundShowsInterest("Je peut être intéressé")).toBe(true);
  });
});

describe("inboundRequestsVerification", () => {
  it("detects identity verification requests", () => {
    expect(
      inboundRequestsVerification(
        "Pouvez-vous identifier clairement la société que vous représenter ?",
      ),
    ).toBe(true);
  });
});

describe("inboundNeedsFollowUp", () => {
  it("combines actionable signals and ignores short refusals", () => {
    expect(inboundNeedsFollowUp("non")).toBe(false);
    expect(inboundNeedsFollowUp("Jeudi 15h ou vendredi 16h")).toBe(true);
    expect(
      inboundNeedsFollowUp("Je vous invite à me contacter au 07 80 99 48 70."),
    ).toBe(true);
  });
});

describe("inboundLooksLikeSchedulingAnswer", () => {
  it("detects explicit time slots", () => {
    expect(inboundLooksLikeSchedulingAnswer("Mardi 14h30 me convient")).toBe(
      true,
    );
  });

  it("detects demain matin", () => {
    expect(inboundLooksLikeSchedulingAnswer("Je suis libre demain matin")).toBe(
      true,
    );
  });

  it("returns false for phone-only requests", () => {
    expect(
      inboundLooksLikeSchedulingAnswer("Appelez-moi au numéro ci-dessous"),
    ).toBe(false);
  });

  it("ignores quoted thread when detecting availability", () => {
    const text = `Jeudi après-midi

> Merci pour votre message`;
    expect(inboundLooksLikeSchedulingAnswer(text)).toBe(true);
  });
});
