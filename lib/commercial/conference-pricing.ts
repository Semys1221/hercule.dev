export const CONFERENCE_CLIENT_TYPES = {
  dec: "dec",
  cif: "cif",
  ias: "ias",
} as const;

export type ConferenceClientType =
  (typeof CONFERENCE_CLIENT_TYPES)[keyof typeof CONFERENCE_CLIENT_TYPES];

export const CONFERENCE_CARDS = {
  dec: "dec",
  courtage: "courtage",
} as const;

export type ConferenceCard = (typeof CONFERENCE_CARDS)[keyof typeof CONFERENCE_CARDS];

export const CONFERENCE_BILLING = {
  monthly: "monthly",
  pack: "pack",
} as const;

export type ConferenceBilling =
  (typeof CONFERENCE_BILLING)[keyof typeof CONFERENCE_BILLING];

export const OFFER_TYPES_CONFERENCE = {
  decMonthly: "conference_dec_monthly",
  decPack: "conference_dec_pack",
  cifMonthly: "conference_cif_monthly",
  cifPack: "conference_cif_pack",
  iasMonthly: "conference_ias_monthly",
  iasPack: "conference_ias_pack",
} as const;

export type ConferenceOfferType =
  (typeof OFFER_TYPES_CONFERENCE)[keyof typeof OFFER_TYPES_CONFERENCE];

export type ConferenceVerticalSelections = {
  cif: boolean;
  ias: boolean;
};

export type ConferenceVerticalCopy = {
  checkboxLabel: string;
  announcement: string;
};

export const CONFERENCE_VERTICAL_COPY: Record<
  ConferenceClientType,
  ConferenceVerticalCopy
> = {
  dec: {
    checkboxLabel: "Je veux exercer en tant que cabinet DEC",
    announcement:
      "Vous recevrez des dirigeants de restauration avec des problématiques de rentabilité, pilotage des coûts et ratio matière.",
  },
  cif: {
    checkboxLabel: "Je veux exercer en tant que CIF",
    announcement:
      "Vous recevrez des professionnels de santé et dirigeants avec des problématiques patrimoniales : transmission, retraite, structuration.",
  },
  ias: {
    checkboxLabel: "Je veux exercer en tant que IAS",
    announcement:
      "Vous recevrez des professionnels de santé avec des problématiques de protection sociale, prévoyance et optimisation fiscale.",
  },
};

export const CONFERENCE_PRICING_AMOUNTS = {
  decMonthlyCents: 149_900,
  decPackCents: 300_000,
  courtageMonthlyCents: 180_000,
  courtagePackCents: 390_000,
} as const;

export const CONFERENCE_RDV_COUNTS = {
  monthly: 10,
  decPack: 30,
  courtagePack: 25,
} as const;

const CONFERENCE_CLIENT_TYPE_SET = new Set<string>(
  Object.values(CONFERENCE_CLIENT_TYPES),
);

export function isConferenceClientType(
  value: string,
): value is ConferenceClientType {
  return CONFERENCE_CLIENT_TYPE_SET.has(value);
}

export function resolveConferenceClientType(input: {
  card: ConferenceCard;
  selections: ConferenceVerticalSelections;
}): ConferenceClientType | null {
  if (input.card === CONFERENCE_CARDS.dec) {
    return CONFERENCE_CLIENT_TYPES.dec;
  }
  if (input.selections.cif) {
    return CONFERENCE_CLIENT_TYPES.cif;
  }
  if (input.selections.ias) {
    return CONFERENCE_CLIENT_TYPES.ias;
  }
  return null;
}

export function hasSecondaryVertical(
  selections: ConferenceVerticalSelections,
): boolean {
  return selections.cif && selections.ias;
}

export function offerTypeForCheckout(
  clientType: ConferenceClientType,
  billing: ConferenceBilling,
): ConferenceOfferType {
  if (clientType === CONFERENCE_CLIENT_TYPES.dec) {
    return billing === CONFERENCE_BILLING.monthly
      ? OFFER_TYPES_CONFERENCE.decMonthly
      : OFFER_TYPES_CONFERENCE.decPack;
  }
  if (clientType === CONFERENCE_CLIENT_TYPES.cif) {
    return billing === CONFERENCE_BILLING.monthly
      ? OFFER_TYPES_CONFERENCE.cifMonthly
      : OFFER_TYPES_CONFERENCE.cifPack;
  }
  return billing === CONFERENCE_BILLING.monthly
    ? OFFER_TYPES_CONFERENCE.iasMonthly
    : OFFER_TYPES_CONFERENCE.iasPack;
}

export function rdvCountForOffer(offerType: ConferenceOfferType): number {
  if (
    offerType === OFFER_TYPES_CONFERENCE.decPack ||
    offerType === OFFER_TYPES_CONFERENCE.cifPack ||
    offerType === OFFER_TYPES_CONFERENCE.iasPack
  ) {
    if (offerType === OFFER_TYPES_CONFERENCE.decPack) {
      return CONFERENCE_RDV_COUNTS.decPack;
    }
    return CONFERENCE_RDV_COUNTS.courtagePack;
  }
  return CONFERENCE_RDV_COUNTS.monthly;
}

export function conferenceCheckoutMode(
  offerType: ConferenceOfferType,
): "subscription" | "payment" {
  return offerType.endsWith("_monthly") ? "subscription" : "payment";
}

export function clientDashboardTitle(clientType: ConferenceClientType): string {
  if (clientType === CONFERENCE_CLIENT_TYPES.dec) {
    return "Espace cabinet DEC";
  }
  if (clientType === CONFERENCE_CLIENT_TYPES.cif) {
    return "Espace cabinet CIF";
  }
  return "Espace cabinet IAS";
}

export function clientDashboardDescription(
  clientType: ConferenceClientType,
): string {
  if (clientType === CONFERENCE_CLIENT_TYPES.dec) {
    return "Suivi de votre déploiement Hercule DEC — restaurants qualifiés et signatures.";
  }
  if (clientType === CONFERENCE_CLIENT_TYPES.cif) {
    return "Suivi de votre déploiement Hercule CIF — projets patrimoniaux qualifiés.";
  }
  return "Suivi de votre déploiement Hercule IAS — projets de protection sociale qualifiés.";
}

export function conferenceOfferLabel(offerType: ConferenceOfferType): string {
  switch (offerType) {
    case OFFER_TYPES_CONFERENCE.decMonthly:
      return "DEC — Abonnement mensuel (1 499 €/mois)";
    case OFFER_TYPES_CONFERENCE.decPack:
      return "DEC — Pack 30 RDV (3 000 €)";
    case OFFER_TYPES_CONFERENCE.cifMonthly:
      return "CIF — Abonnement mensuel (1 800 €/mois)";
    case OFFER_TYPES_CONFERENCE.cifPack:
      return "CIF — Pack 25 RDV (3 900 €)";
    case OFFER_TYPES_CONFERENCE.iasMonthly:
      return "IAS — Abonnement mensuel (1 800 €/mois)";
    case OFFER_TYPES_CONFERENCE.iasPack:
      return "IAS — Pack 25 RDV (3 900 €)";
    default:
      return offerType;
  }
}
