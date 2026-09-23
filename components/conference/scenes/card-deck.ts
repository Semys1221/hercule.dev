export type CardSection = "S10";

export type StageCard = {
  id: string;
  section: CardSection;
  kicker?: string;
  title?: string;
  body?: string;
  visual?: "timeline" | "dual-mark" | "text";
};

export const SECTION_OFFSETS: Record<CardSection, number> = {
  S10: 0,
};

export function globalCardIndex(section: CardSection, step: number): number {
  return SECTION_OFFSETS[section] + step;
}

export const STAGE_CARDS: StageCard[] = [
  {
    id: "s10-month",
    section: "S10",
    visual: "timeline",
    kicker: "30 jours",
    title: "Deux rendez-vous par semaine",
    body: "Huit rendez-vous sur le mois.",
  },
  {
    id: "s10-zoom",
    section: "S10",
    visual: "timeline",
    kicker: "4 mois",
    title: "25–30",
    body: "Rendez-vous qualifiés.",
  },
];

export type OfferEdition = "DEC" | "Courtage";

export type OfferPhrase = {
  id: string;
  kicker: string;
  text: string;
  pills?: string[];
};

export type EquationTerm = {
  id: string;
  kicker: string;
  value: string;
  joiner?: "×" | "→" | "=";
};

export type MrrColumn = {
  id: string;
  label: string;
  amount: string;
  caption: string;
  weight: number;
};

export type StairStep = {
  id: string;
  label: string;
  amount: string;
  weight: number;
  caption?: string;
};

export const DEC_CUMULATIVE_3M = [
  { id: "m1", label: "Mois 1", amount: "1 500 €", weight: 1.5 },
  { id: "m2", label: "Mois 2", amount: "4 500 €", weight: 4.5 },
  { id: "m3", label: "Mois 3", amount: "9 000 €", weight: 9 },
] as const;

export const DEC_CUMULATIVE_RETURN = "9 000 €";
export const DEC_CUMULATIVE_CAPTION = "CA cumulé · 3 mois";
export const DEC_ROI_LINE = `${DEC_CUMULATIVE_RETURN} de CA cumulé sur 3 mois`;

export const COURTAGE_CUMULATIVE_RETURN = "32 500 €";
export const COURTAGE_ROI_LINE = `${COURTAGE_CUMULATIVE_RETURN} de commissions sur 3 mois`;

const DEC_CUMULATIVE_COLUMNS: MrrColumn[] = DEC_CUMULATIVE_3M.map((step) => ({
  id: step.id,
  label: step.label,
  amount: step.amount,
  caption: "CA cumulé",
  weight: step.weight,
}));

const DEC_STAIR_STEPS: StairStep[] = DEC_CUMULATIVE_3M.map((step) => ({
  ...step,
  caption: "CA cumulé",
}));

export type OfferStory = {
  edition: OfferEdition;
  title: string;
  niche: string;
  scoreReturn: string;
  scoreCaption?: string;
  scorePrice: string;
  caseBeats: OfferPhrase[];
  equation: EquationTerm[];
  curve:
    | { kind: "mrr"; columns: MrrColumn[] }
    | {
        kind: "commission";
        formula: string;
        from: number;
        to: number;
        result: string;
        caption: string;
      };
  contrast: {
    kind: "stair";
    steps: StairStep[];
    priceLabel: string;
    priceAmount: string;
  } | {
    kind: "bars";
    gain: { label: string; amount: string; weight: number };
    price: { label: string; amount: string; weight: number };
  };
};

export const DEC_OFFER: OfferStory = {
  edition: "DEC",
  title: "DEC",
  niche: "Restaurant",
  scoreReturn: DEC_CUMULATIVE_RETURN,
  scoreCaption: DEC_CUMULATIVE_CAPTION,
  scorePrice: "1 499 € / mois",
  caseBeats: [
    { id: "dec-niche", kicker: "Niche", text: "Restaurant" },
    {
      id: "dec-problem",
      kicker: "Problème",
      text: "Le chiffre d’affaires monte. La marge se contracte.",
    },
    {
      id: "dec-why",
      kicker: "Pourquoi",
      text: "Le cabinet actuel n’adresse pas cette problématique.",
    },
    {
      id: "dec-value",
      kicker: "Apport",
      text: "Ce que vous apportez.",
      pills: ["Ratio matière", "Pilotage des coûts", "Rentabilité"],
    },
  ],
  equation: [
    { id: "dec-budget", kicker: "Budget", value: "300 € / mois", joiner: "×" },
    {
      id: "dec-rdv",
      kicker: "Rendez-vous",
      value: "10 profils",
      joiner: "→",
    },
    {
      id: "dec-conversion",
      kicker: "Conversion",
      value: "5 signatures · 50 %",
      joiner: "=",
    },
    { id: "dec-roi", kicker: "ROI mensuel", value: "1 500 € / mois" },
  ],
  curve: {
    kind: "mrr",
    columns: DEC_CUMULATIVE_COLUMNS,
  },
  contrast: {
    kind: "stair",
    steps: DEC_STAIR_STEPS,
    priceLabel: "Prix",
    priceAmount: "1 499 € / mois",
  },
};

export const COURTAGE_OFFER: OfferStory = {
  edition: "Courtage",
  title: "Courtage",
  niche: "Médecin",
  scoreReturn: COURTAGE_CUMULATIVE_RETURN,
  scoreCaption: "Commissions · 3 mois",
  scorePrice: "3 900 € / 3 mois",
  caseBeats: [
    { id: "courtage-niche", kicker: "Niche", text: "Médecin" },
    {
      id: "courtage-problem",
      kicker: "Problème",
      text: "Les revenus sont là. L’impôt monte.",
    },
    {
      id: "courtage-why",
      kicker: "Pourquoi",
      text: "Retraite, patrimoine, prévoyance et financement dispersés.",
    },
    {
      id: "courtage-value",
      kicker: "Apport",
      text: "Architecture patrimoniale.",
      pills: ["PER", "Lombard", "SCPI", "Prévoyance"],
    },
  ],
  equation: [
    { id: "courtage-ticket", kicker: "Ticket", value: "50 000 €", joiner: "×" },
    {
      id: "courtage-commission",
      kicker: "Commission",
      value: "2 500 € · 5 %",
      joiner: "→",
    },
    {
      id: "courtage-rdv",
      kicker: "Rendez-vous",
      value: "25 profils / 3 mois",
      joiner: "→",
    },
    {
      id: "courtage-conversion",
      kicker: "Conversion",
      value: "13 signatures · 50 %",
    },
  ],
  curve: {
    kind: "commission",
    formula: "13 × 2 500 €",
    from: 0,
    to: 32500,
    result: "32 500 €",
    caption: "Commissions sur 3 mois",
  },
  contrast: {
    kind: "bars",
    gain: {
      label: "Commissions · 3 mois",
      amount: "32 500 €",
      weight: 325,
    },
    price: {
      label: "Prix · une fois",
      amount: "3 900 € / 3 mois",
      weight: 39,
    },
  },
};

export const DEC_STEP_COUNT = 11;
export const COURTAGE_STEP_COUNT = 11;
