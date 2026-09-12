import {
  CIF_DIFFERENTIATOR_OPTIONS,
  CIF_Q21_DESCRIPTION,
  CIF_Q21_PROMPT,
} from "@/lib/admin/funnels/cif-sales-copy";
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
    prompt: "Quels sont vos principaux agréments et domaines d'expertise ?",
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
    prompt: "Combien de nouveaux mandats pouvez-vous actuellement accepter par mois ?",
    description: "Mandats par mois.",
    slider: CIF_SLIDER_CONFIGS.projectCapacity,
  },
  {
    id: "q4",
    number: 4,
    sectionId: "capacite",
    type: "single",
    prompt: "Quel est actuellement votre principal niveau de disponibilité ?",
    options: [
      { id: "high", label: "Forte capacité disponible" },
      { id: "moderate", label: "Capacité disponible modérée" },
      { id: "limited", label: "Capacité limitée" },
      { id: "full", label: "Équipe actuellement complète" },
      { id: "variable", label: "Variable selon le type de mandat" },
    ],
  },
  {
    id: "q5",
    number: 5,
    sectionId: "capacite",
    type: "single",
    prompt:
      "Quel est votre délai habituel pour tenir un premier RDV de conseil après validation du mandat ?",
    options: [
      { id: "lt_48h", label: "Moins de 48 heures" },
      { id: "2_5_days", label: "2 à 5 jours" },
      { id: "1_2_weeks", label: "1 à 2 semaines" },
      { id: "gt_2_weeks", label: "Plus de 2 semaines" },
      { id: "variable", label: "Variable selon le dossier" },
    ],
  },
  {
    id: "q6",
    number: 6,
    sectionId: "historique",
    type: "slider",
    prompt:
      "Au cours des 12 derniers mois, combien de mandats ont connu un retard significatif de mise en place ou de reporting ?",
    description: "Nombre de mandats en retard.",
    slider: CIF_SLIDER_CONFIGS.delayCount,
  },
  {
    id: "q7",
    number: 7,
    sectionId: "historique",
    type: "slider",
    prompt:
      "Au cours des 12 derniers mois, combien de clients avez-vous perdus en raison d'un problème lié à la mission ?",
    description: "Nombre de clients perdus.",
    slider: CIF_SLIDER_CONFIGS.lostClients,
    optOutLabel: "Je ne dispose pas de cette information",
  },
  {
    id: "q8",
    number: 8,
    sectionId: "historique",
    type: "multi",
    maxSelections: 3,
    exclusiveOptionId: "none",
    prompt: "Parmi les difficultés suivantes, lesquelles avez-vous principalement rencontrées ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "delays", label: "Retards de mise en place / reporting patrimonial" },
      { id: "technical", label: "Problèmes outils / plateformes / agrégateurs" },
      { id: "communication", label: "Communication / suivi client" },
      { id: "scope", label: "Périmètre du mandat mal défini" },
      { id: "availability", label: "Manque de disponibilité de l'équipe" },
      { id: "external", label: "Dépendance à des prestataires externes (notaire, avocat)" },
      { id: "kyc", label: "Blocages KYC / LCB-FT / collecte d'encours trop petits" },
      { id: "bank_competition", label: "Concurrence banque privée / réseau sur le dossier" },
      { id: "client", label: "Difficultés liées au dirigeant {clientSegment}" },
      { id: "none", label: "Aucune difficulté significative" },
    ],
  },
  {
    id: "q9",
    number: 9,
    sectionId: "historique",
    type: "single",
    prompt:
      "Lorsqu'un mandat dépasse votre capacité disponible, quelle solution utilisez-vous généralement ?",
    options: [
      { id: "refuse", label: "Nous refusons le mandat" },
      { id: "delay", label: "Nous reportons son démarrage" },
      { id: "freelance", label: "Nous faisons appel à des conseillers externes" },
      { id: "outsource", label: "Nous sous-traitons une partie du mandat" },
      { id: "hire", label: "Nous recrutons / renforçons temporairement l'équipe" },
      { id: "depends", label: "Cela dépend du mandat" },
    ],
  },
  {
    id: "q10",
    number: 10,
    sectionId: "historique",
    type: "single",
    prompt:
      "Disposez-vous de processus internes standardisés pour vos missions principales ?",
    options: [
      { id: "all", label: "Oui, pour toutes nos missions" },
      { id: "majority", label: "Oui, pour la majorité" },
      { id: "partial", label: "Partiellement" },
      { id: "no", label: "Non" },
    ],
  },
  {
    id: "q21",
    number: 11,
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
    prompt: "Quels types de dirigeants souhaitez-vous principalement accompagner ?",
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
    prompt: "Quel niveau de complexité de mandat souhaitez-vous principalement traiter ?",
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
      "Quel montant minimum d'honoraires annuels acceptez-vous pour un mandat de conseil ({clientSegment}) ?",
    description: `Plancher marché : ${annualFloorLabel}.`,
    slider: CIF_SLIDER_CONFIGS.annualMin,
  },
  {
    id: "q14",
    number: 15,
    sectionId: "standards",
    type: "single",
    prompt: "Comment facturez-vous habituellement vos mandats de conseil ?",
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
    prompt: "Comment êtes-vous principalement rémunéré sur vos mandats {clientSegment} ?",
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
      "Quel montant minimum d'honoraires facturez-vous pour une mission ponctuelle (étude patrimoniale, bilan, conseil) ?",
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
    prompt: "Quels types de missions {clientSegment} souhaitez-vous recevoir en priorité ?",
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
    prompt: "Quelle capacité souhaitez-vous réserver aux missions {clientSegment} provenant d'Hercule ?",
    description: "Mandats par mois réservés à Hercule.",
    slider: CIF_SLIDER_CONFIGS.herculeCapacity,
  },
];
