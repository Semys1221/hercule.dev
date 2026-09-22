export type CardSection = "S10" | "S12";

export type StageCard = {
  id: string;
  section: CardSection;
  kicker?: string;
  title?: string;
  body?: string;
  visual?: "timeline" | "dual-mark" | "text";
};

export const SECTION_OFFSETS: Record<CardSection, number> = {
  S10: 0, // 3 cards  (indices 0–2)
  S12: 3, // 5 cards  (indices 3–7)
};

export function globalCardIndex(section: CardSection, step: number): number {
  return SECTION_OFFSETS[section] + step;
}

export const STAGE_CARDS: StageCard[] = [
  // ── S10 — Le temps (3) ────────────────────────────────
  {
    id: "s10-minutes",
    section: "S10",
    visual: "timeline",
    kicker: "La question",
    title: "Quelques minutes",
    body: "Après la question, il prend rendez-vous.",
  },
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

  // ── S12 — Infrastructures (5) ─────────────────────────
  {
    id: "s12-two",
    section: "S12",
    visual: "dual-mark",
    kicker: "Infrastructures",
    title: "Deux infrastructures",
    body: "Disponibles aujourd’hui.",
  },
  {
    id: "s12-markets",
    section: "S12",
    visual: "dual-mark",
    kicker: "Marchés",
    title: "DEC · Courtage",
    body: "Deux marchés différents.",
  },
  {
    id: "s12-principle",
    section: "S12",
    visual: "text",
    kicker: "Principe",
    title: "Identifier, qualifier, amener jusqu’à l’agenda",
  },
  {
    id: "s12-params",
    section: "S12",
    visual: "text",
    kicker: "Paramètres",
    title: "Calendrier · Zoom Pro · Intégration",
    body: "Tout est finalisé.",
  },
  {
    id: "s12-ready",
    section: "S12",
    visual: "text",
    kicker: "Déjà en place",
    title: "Vous ouvrez Zoom",
    body: "Vous auditez. Vous présentez.",
  },
];

export type OfferLine = {
  id: string;
  theme: string;
  text: string;
};

export const DEC_OFFER_LINES: OfferLine[] = [
  { id: "dec-niche", theme: "Niche", text: "Restaurant" },
  { id: "dec-problem", theme: "Problème", text: "Le chiffre d’affaires monte. La marge se contracte." },
  { id: "dec-why", theme: "Pourquoi", text: "Le cabinet actuel ne traite pas ça." },
  { id: "dec-value", theme: "Apport", text: "Ratio matière, pilotage, coûts, rentabilité." },
  { id: "dec-budget", theme: "Budget", text: "300 € / mois" },
  { id: "dec-rdv", theme: "Rendez-vous", text: "10 qualifiés / mois" },
  { id: "dec-conversion", theme: "Conversion", text: "5 signatures · 50 %" },
  { id: "dec-roi", theme: "ROI mensuel", text: "1 500 € / mois" },
  { id: "dec-quarter", theme: "Trimestre", text: "4 500 €" },
  { id: "dec-year", theme: "12 mois", text: "18 000 € / mois" },
  { id: "dec-price", theme: "Prix", text: "1 499 € pour 1 mois" },
  { id: "dec-diff", theme: "Différence", text: "1 499 € une fois. 1 500 € chaque mois ensuite." },
];

export const COURTAGE_OFFER_LINES: OfferLine[] = [
  { id: "courtage-niche", theme: "Niche", text: "Médecin" },
  { id: "courtage-problem", theme: "Problème", text: "Pression fiscale. Les revenus sont là, l’impôt monte." },
  { id: "courtage-why", theme: "Pourquoi", text: "Retraite, patrimoine, prévoyance, financement : tout est dispersé." },
  { id: "courtage-value", theme: "Apport", text: "Architecture : PER, Lombard, SCPI, prévoyance." },
  { id: "courtage-ticket", theme: "Ticket", text: "50 000 €" },
  { id: "courtage-commission", theme: "Commission", text: "2 500 € · 5 %" },
  { id: "courtage-rdv", theme: "Rendez-vous", text: "25 profils qualifiés / 3 mois" },
  { id: "courtage-conversion", theme: "Conversion", text: "13 signatures · 50 %" },
  { id: "courtage-roi", theme: "ROI 3 mois", text: "32 500 € · 13 × 2 500 €" },
  { id: "courtage-price", theme: "Prix", text: "3 900 € pour 3 mois" },
  { id: "courtage-diff", theme: "Différence", text: "32 500 € de commissions. 3 900 € une fois." },
  { id: "courtage-retract", theme: "Rétractation", text: "4 jours" },
];
