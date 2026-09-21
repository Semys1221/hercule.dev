import {
  CIF_DIFFERENTIATOR_OPTIONS,
  CIF_Q21_DESCRIPTION,
  CIF_Q21_PROMPT,
} from "@/lib/legacy/admin/funnels/cif-sales-copy";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import type { SalesQuestion, SalesSliderConfig, SalesSliderUnit } from "./sales-questions";

/** Prix Hercule Starter — utilisé pour l'éligibilité Calendly, pas pour les honoraires dirigeant. */
export const CIF_MONTHLY_MIN = Math.round(
  COMMERCIAL_COMPTABLE.monthlyPriceCents / 100,
);

/** Plancher honoraires annuels mandat de conseil dirigeant. */
export const CIF_ANNUAL_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesAnnuelsMinCents / 100,
);

export const CIF_PONCTUEL_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesPonctuelMinCents / 100,
);

export const CIF_ANNUAL_TYPICAL = Math.round(
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesCents / 100,
);

export const CIF_FACTURATION_MODES = [
  "monthly_12",
  "quarterly",
  "annual",
  "encours",
  "variable",
] as const;

export type CifFacturationMode = (typeof CIF_FACTURATION_MODES)[number];

export const CIF_REMUNERATION_MODES = [
  "honoraires",
  "commissions",
  "mixte",
] as const;

export type CifRemunerationMode = (typeof CIF_REMUNERATION_MODES)[number];

const countFormatter = new Intl.NumberFormat("fr-FR");

function formatSliderLabel(value: number, unit: SalesSliderUnit): string {
  const formatted = countFormatter.format(value);
  switch (unit) {
    case "eur":
      return `${formatted} €`;
    case "eur_month":
      return `${formatted} € / mois`;
    case "eur_year":
      return `${formatted} € / an`;
    case "months":
      return value === 1 ? "1 mois" : `${formatted} mois`;
    case "count":
      return formatted;
  }
}

const BASE_SLIDER_CONFIGS = {
  projectCapacity: {
    min: 0,
    max: 15,
    step: 1,
    unit: "count" as const,
    defaultValue: 0,
  },
  delayCount: {
    min: 0,
    max: 10,
    step: 1,
    unit: "count" as const,
    defaultValue: 0,
  },
  lostClients: {
    min: 0,
    max: 10,
    step: 1,
    unit: "count" as const,
    defaultValue: 0,
  },
  annualMin: {
    min: CIF_ANNUAL_MIN,
    max: 12_000,
    step: 100,
    unit: "eur_year" as const,
    defaultValue: CIF_ANNUAL_TYPICAL,
  },
  ponctuelMin: {
    min: CIF_PONCTUEL_MIN,
    max: 5_000,
    step: 100,
    unit: "eur" as const,
    defaultValue: CIF_PONCTUEL_MIN,
  },
  herculeCapacity: {
    min: 1,
    max: 15,
    step: 1,
    unit: "count" as const,
    defaultValue: 1,
  },
} satisfies Record<string, SalesSliderConfig>;

export const CIF_SLIDER_CONFIGS = BASE_SLIDER_CONFIGS;

const annualFloorLabel = formatSliderLabel(CIF_ANNUAL_MIN, "eur_year");

export const CIF_SALES_QUESTIONS: SalesQuestion[] = [
  {
    id: "q1",
    number: 1,
    sectionId: "capacite",
    type: "multi",
    maxSelections: 3,
    prompt: "Quelles missions votre cabinet propose-t-il actuellement ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "patrimoine_epargne", label: "Patrimoine / épargne (AV, PER, PEA, assurance-vie)" },
      { id: "tresorerie_entreprise", label: "Trésorerie d'entreprise / cash-flow dirigeant" },
      { id: "retraite_prevoyance", label: "Retraite / prévoyance dirigeant (PER, Madelin)" },
      { id: "transmission", label: "Transmission / cession (Dutreil, holding, plus-value)" },
      { id: "immobilier_scpi", label: "Immobilier / SCPI / défiscalisation" },
      { id: "credit", label: "Crédit / financement (IOBSP)" },
      { id: "assurance", label: "Courtage assurance (ORIAS)" },
      { id: "fiscal_patrimonial", label: "Ingénierie fiscale patrimoniale" },
      { id: "obligations_declaratives", label: "Obligations déclaratives patrimoniales" },
      { id: "conseil_gestion", label: "Conseil en gestion de patrimoine global" },
    ],
  },
  {
    id: "q2",
    number: 2,
    sectionId: "capacite",
    type: "multi",
    maxSelections: 3,
    hasOtherInput: true,
    otherInputFieldId: "q2Other",
    prompt: "Quels sont les principaux agréments et domaines d'expertise du cabinet ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "cif_amf", label: "Conseiller en investissements financiers (AMF)" },
      { id: "orias_assurance", label: "Courtage assurance (ORIAS)" },
      { id: "iobsp", label: "Intermédiaire en opérations de banque (IOBSP)" },
      { id: "cgp_independant", label: "CGP indépendant / cabinet associatif" },
      { id: "reseau", label: "Réseau ou enseigne (banque, assurance, CGP)" },
      { id: "ingenierie", label: "Ingénierie patrimoniale / fiscale" },
      { id: "tresorerie", label: "Trésorerie d'entreprise / dirigeant" },
      { id: "transmission", label: "Transmission / cession d'entreprise" },
      { id: "immobilier", label: "Immobilier / SCPI" },
      { id: "other", label: "Autre agrément ou spécialité" },
    ],
  },
  {
    id: "q3",
    number: 3,
    sectionId: "capacite",
    type: "slider",
    prompt: "Combien de nouveaux mandats le cabinet peut-il actuellement accepter par mois ?",
    description:
      "Combien de demandes de RDV d'étude / nouveaux mandats le cabinet peut traiter par mois — une fois la zone live ?",
    slider: CIF_SLIDER_CONFIGS.projectCapacity,
  },
  {
    id: "q21",
    number: 4,
    sectionId: "standards",
    type: "multi",
    maxSelections: 3,
    prompt: CIF_Q21_PROMPT,
    description: CIF_Q21_DESCRIPTION,
    options: CIF_DIFFERENTIATOR_OPTIONS.map((option) => ({ ...option })),
  },
  {
    id: "q11",
    number: 12,
    sectionId: "standards",
    type: "multi",
    maxSelections: 2,
    prompt: "Quels types de dirigeants le cabinet souhaite-t-il principalement accompagner ?",
    description: "Sélectionnez jusqu'à 2 réponses.",
    options: [
      {
        id: "freelancers",
        label: "Indépendants / professions libérales",
        helpTitle: "Indépendants / professions libérales",
        helpText:
          "Patrimoine personnel, retraite, prévoyance — encours limité, relation directe avec le dirigeant.",
      },
      {
        id: "tpe",
        label: "TPE — 1 à 10 salariés",
        helpTitle: "TPE — 1 à 10 salariés",
        helpText:
          "Trésorerie d'entreprise et patrimoine du dirigeant. Dirigeant souvent saturé, honoraires au plancher cabinet.",
      },
      {
        id: "pme_small",
        label: "PME — 11 à 50 salariés",
        helpTitle: "PME — 11 à 50 salariés",
        helpText:
          "Dossiers plus structurés (cash-flow, holding, multi-activités). Patrimoine, trésorerie et transmission.",
      },
      {
        id: "pme_medium",
        label: "PME — 51 à 250 salariés",
        helpTitle: "PME — 51 à 250 salariés",
        helpText:
          "Dossiers plus structurés (cash-flow, holding, multi-établissements). Patrimoine, trésorerie et transmission.",
      },
      {
        id: "eti",
        label: "ETI — 251 à 500 salariés",
        disabled: true,
        helpTitle: "ETI — 251 à 500 salariés",
        helpText:
          "Hors périmètre : process groupe, appels d'offres, volumes incompatibles avec le matching actuel.",
      },
      {
        id: "enterprise",
        label: "Grandes structures — 500+ salariés",
        disabled: true,
        helpTitle: "Grandes structures — 500+ salariés",
        helpText:
          "Hors périmètre : process groupe, appels d'offres, volumes incompatibles avec le matching actuel.",
      },
    ],
  },
  {
    id: "q12",
    number: 13,
    sectionId: "standards",
    type: "single",
    prompt: "Quel niveau de complexité de mandat le cabinet souhaite-t-il principalement traiter ?",
    options: [
      {
        id: "simple",
        label: "Mandats simples / standardisés",
        helpTitle: "Mandats simples / standardisés",
        helpText:
          "Épargne standard, PER, assurance-vie — peu de structuration spécifique.",
      },
      {
        id: "intermediate",
        label: "Mandats intermédiaires",
        helpTitle: "Mandats intermédiaires",
        helpText:
          "Patrimoine moyen, trésorerie d'entreprise, quelques spécificités sectorielles.",
      },
      {
        id: "complex",
        label: "Mandats complexes",
        helpTitle: "Mandats complexes",
        helpText:
          "Multi-activités, reprise de portefeuille, restructurations légères, plusieurs établissements.",
      },
      {
        id: "technical",
        label: "Mandats à forte composante d'ingénierie",
        helpTitle: "Mandats à forte composante d'ingénierie",
        helpText:
          "Transmission Dutreil, holding, ingénierie fiscale avancée, encours élevés.",
      },
      {
        id: "all",
        label: "Tous niveaux",
        helpTitle: "Tous niveaux",
        helpText: "Le cabinet accepte le mix de complexités ci-dessus.",
      },
    ],
  },
  {
    id: "q13",
    number: 14,
    sectionId: "standards",
    type: "slider",
    prompt:
      "Quel montant minimum d'honoraires annuels le cabinet accepte-t-il pour un mandat de conseil ({clientSegment}) ?",
    description: `Plancher marché : ${annualFloorLabel}.`,
    slider: CIF_SLIDER_CONFIGS.annualMin,
  },
  {
    id: "q14",
    number: 15,
    sectionId: "standards",
    type: "single",
    prompt: "Comment le cabinet facture-t-il habituellement ses mandats de conseil ?",
    description: "Modalité de facturation — pas la durée du contrat.",
    options: [
      { id: "monthly_12", label: "Mensualisé (12 acomptes)" },
      { id: "quarterly", label: "Trimestriel" },
      { id: "annual", label: "Annuel" },
      { id: "encours", label: "Frais sur encours / commissions produits" },
      { id: "variable", label: "Selon le mandat" },
    ],
  },
  {
    id: "q15",
    number: 16,
    sectionId: "conditions",
    type: "single",
    prompt: "Comment le cabinet est-il principalement rémunéré sur ses mandats {clientSegment} ?",
    options: [
      { id: "honoraires", label: "Honoraires de conseil (forfait / mandat)" },
      { id: "commissions", label: "Commissions produits (assurance, placements, SCPI…)" },
      { id: "mixte", label: "Mixte honoraires + commissions" },
    ],
  },
  {
    id: "q16",
    number: 17,
    sectionId: "conditions",
    type: "slider",
    prompt:
      "Quel montant minimum d'honoraires le cabinet facture-t-il pour une mission ponctuelle (étude patrimoniale, bilan, conseil) ?",
    description: "Étude, bilan patrimonial, conseil — hors mandat annuel.",
    slider: CIF_SLIDER_CONFIGS.ponctuelMin,
    optOutLabel: "Toujours packagée dans le mandat récurrent",
  },
  {
    id: "q19",
    number: 18,
    sectionId: "conditions",
    type: "multi",
    maxSelections: 3,
    prompt: "Quels types de missions {clientSegment} le cabinet souhaite-t-il recevoir en priorité ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "one_off", label: "Missions ponctuelles (étude, bilan patrimonial)" },
      { id: "recurring", label: "Mandats annuels de conseil patrimonial / trésorerie" },
      { id: "redesign", label: "Reprises de portefeuille / changement de CGP" },
      { id: "tresorerie", label: "Trésorerie d'entreprise / cash-flow" },
      { id: "transmission", label: "Transmission / cession (Dutreil, holding)" },
      { id: "retraite", label: "Retraite / prévoyance dirigeant" },
      { id: "immobilier", label: "Immobilier / SCPI" },
      { id: "patrimoine_recurrent", label: "Patrimoine récurrent (épargne, placements)" },
      { id: "high_value", label: "Mandats à encours élevés" },
    ],
  },
  {
    id: "q20",
    number: 19,
    sectionId: "conditions",
    type: "slider",
    prompt: "Quelle capacité le cabinet réserve-t-il aux missions {clientSegment} provenant d'Hercule ?",
    description:
      "Quelle capacité agenda le cabinet réserve aux demandes inbound Foundation pour traiter {cause} ? Ces créneaux sont ceux du cabinet, pas une file d'apporteur.",
    slider: CIF_SLIDER_CONFIGS.herculeCapacity,
  },
];
