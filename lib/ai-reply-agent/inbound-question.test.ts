import { describe, expect, it } from "vitest";

import {
  inboundClaimsBookingDone,
  inboundIsPoliteProposalAcknowledgment,
  inboundIsPureAcknowledgment,
  inboundIsPureInterestSignal,
  inboundLooksLikePartnerDueDiligence,
  inboundLooksLikeProspectQualityObjection,
  inboundLooksLikePhoneRequest,
  inboundLooksLikeQuestion,
  inboundLooksLikeSchedulingAnswer,
  inboundNeedsFollowUp,
  inboundProvidesPhoneNumber,
  inboundRequestsVerification,
  inboundShowsConfusion,
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

  it("detects soft agreement with exchange intent", () => {
    expect(
      inboundShowsInterest(
        "D'accord, avec plaisir pour échanger sur le sujet.",
      ),
    ).toBe(true);
  });
});

describe("inboundClaimsBookingDone", () => {
  it("detects explicit booking claims", () => {
    expect(inboundClaimsBookingDone("J'ai réservé un créneau via Calendly.")).toBe(
      true,
    );
  });

  it("returns false for soft interest only", () => {
    expect(
      inboundClaimsBookingDone("Avec plaisir pour échanger sur le sujet."),
    ).toBe(false);
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

describe("inboundShowsConfusion", () => {
  it("detects je n'ai pas saisi", () => {
    expect(
      inboundShowsConfusion(
        "Je n'ai pas saisi. Nous sommes un bureau d'expertise comptable belge.",
      ),
    ).toBe(true);
  });

  it("returns false for short thanks", () => {
    expect(inboundShowsConfusion("Top merci")).toBe(false);
  });
});

describe("inboundIsPoliteProposalAcknowledgment", () => {
  it("detects merci pour cette proposition", () => {
    expect(inboundIsPoliteProposalAcknowledgment("Merci pour cette proposition.")).toBe(
      true,
    );
  });

  it("returns false for explicit decline", () => {
    expect(
      inboundIsPoliteProposalAcknowledgment("Non merci, pas pour nous."),
    ).toBe(false);
  });

  it("returns false when interest is explicit", () => {
    expect(
      inboundIsPoliteProposalAcknowledgment(
        "Merci pour cette proposition, je suis intéressé.",
      ),
    ).toBe(false);
  });

  it("returns false for top merci without proposal mention", () => {
    expect(inboundIsPoliteProposalAcknowledgment("Top merci")).toBe(false);
  });
});

describe("inboundIsPureAcknowledgment", () => {
  it("detects top merci", () => {
    expect(inboundIsPureAcknowledgment("Top merci")).toBe(true);
  });

  it("returns false for confusion messages", () => {
    expect(
      inboundIsPureAcknowledgment("Je n'ai pas saisi. Nous sommes un cabinet belge."),
    ).toBe(false);
  });

  it("returns false for questions", () => {
    expect(inboundIsPureAcknowledgment("Merci, pouvez-vous m'envoyer le lien ?")).toBe(
      false,
    );
  });
});

describe("inboundNeedsFollowUp", () => {
  it("combines actionable signals and ignores short refusals", () => {
    expect(inboundNeedsFollowUp("non")).toBe(false);
    expect(
      inboundNeedsFollowUp(
        "Je n'ai pas saisi. Nous sommes un bureau d'expertise comptable belge.",
      ),
    ).toBe(true);
    expect(inboundNeedsFollowUp("Jeudi 15h ou vendredi 16h")).toBe(true);
    expect(
      inboundNeedsFollowUp("Je vous invite à me contacter au 07 80 99 48 70."),
    ).toBe(true);
  });

  it("allows grok path for polite proposal thank-you", () => {
    expect(inboundNeedsFollowUp("Merci pour cette proposition.")).toBe(true);
  });

  it("allows grok path for partial-answer complaints", () => {
    expect(
      inboundNeedsFollowUp(
        "Vous n'avez répondu qu'à une partie de mes interrogations.",
      ),
    ).toBe(true);
  });

  it("allows grok path for Calendly host mismatch", () => {
    expect(
      inboundNeedsFollowUp(
        "J'annule car ce n'est pas vous mais Evan sur Calendly.",
      ),
    ).toBe(true);
  });
});

describe("inboundIsPureInterestSignal", () => {
  it("detects CTA click 'Mon cabinet est compatible'", () => {
    expect(inboundIsPureInterestSignal("Mon cabinet est compatible")).toBe(true);
  });

  it("detects short soft agreement 'Avec plaisir'", () => {
    expect(inboundIsPureInterestSignal("Avec plaisir")).toBe(true);
  });

  it("detects 'Effectivement' alone", () => {
    expect(inboundIsPureInterestSignal("Effectivement")).toBe(true);
  });

  it("detects 'd'accord' alone", () => {
    expect(inboundIsPureInterestSignal("D'accord")).toBe(true);
  });

  it("returns false when interest is accompanied by a question", () => {
    expect(
      inboundIsPureInterestSignal("Avec plaisir, comment cela fonctionne-t-il ?"),
    ).toBe(false);
  });

  it("returns false when interest is accompanied by a phone request", () => {
    expect(
      inboundIsPureInterestSignal("Je suis intéressé, pouvez-vous m'appeler ?"),
    ).toBe(false);
  });

  it("returns false when interest is accompanied by a scheduling answer", () => {
    expect(
      inboundIsPureInterestSignal("D'accord, je suis disponible lundi 14h"),
    ).toBe(false);
  });

  it("returns false for pure acknowledgment without interest keyword", () => {
    // "merci" alone is NOT in INTEREST_KEYWORDS
    expect(inboundIsPureInterestSignal("Merci")).toBe(false);
  });

  it("returns false for empty text", () => {
    expect(inboundIsPureInterestSignal("")).toBe(false);
    expect(inboundIsPureInterestSignal("(empty body)")).toBe(false);
  });

  it("returns false when text contains no interest keyword", () => {
    // Refusal without any keyword from INTEREST_KEYWORDS
    expect(inboundIsPureInterestSignal("Bonjour, nous n'avons pas besoin de ce service.")).toBe(false);
    expect(inboundIsPureInterestSignal("Non merci.")).toBe(false);
  });

  it("returns false when booking is claimed", () => {
    expect(
      inboundIsPureInterestSignal("D'accord, j'ai réservé un créneau Calendly."),
    ).toBe(false);
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

describe("inboundLooksLikeProspectQualityObjection", () => {
  const PAPPERS_EXCERPT = `Lorsque vous indiquez que les restaurants sont des prospects identifiés et qualifiés via Pappers,
pouvez-vous me confirmer qu'ils ont été contactés directement par Hercule et qu'ils ont expressément confirmé
rechercher actuellement un nouveau cabinet d'expertise comptable, et qu'il ne s'agit pas uniquement d'entreprises
identifiées à partir de signaux issus de Pappers/Sirene ?
Pouvez-vous également me communiquer le tarif HT de votre offre, sans prise de rendez-vous préalable ?`;

  it("detects Pappers / qualification skepticism", () => {
    expect(inboundLooksLikeProspectQualityObjection(PAPPERS_EXCERPT)).toBe(
      true,
    );
  });

  it("ignores a single pricing question", () => {
    expect(
      inboundLooksLikeProspectQualityObjection("Quelle est votre commission ?"),
    ).toBe(false);
  });
});

describe("inboundLooksLikePartnerDueDiligence", () => {
  it("detects a structured partnership questionnaire", () => {
    const text = `Le projet peut m'intéresser. J'aurais besoin de précisions.
Quel est le cadre réglementaire ? CIF ou ORIAS ?
Comment sont organisées les mises en relation, sont-elles exclusives ?
Quel est le modèle économique ?`;
    expect(inboundLooksLikePartnerDueDiligence(text)).toBe(true);
  });

  it("ignores a single pricing question", () => {
    expect(
      inboundLooksLikePartnerDueDiligence("Quelle est votre commission ?"),
    ).toBe(false);
  });
});
