import {
  COMPTABLE_DIFFERENTIATOR_OPTIONS,
  COMPTABLE_Q21_DESCRIPTION,
  COMPTABLE_Q21_PROMPT,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import type { SalesQuestion, SalesSliderConfig, SalesSliderUnit } from "./sales-questions";

/** Prix Hercule Starter — utilisé pour l'éligibilité Calendly, pas pour les honoraires TPE. */
export const COMPTABLE_MONTHLY_MIN = Math.round(
  COMMERCIAL_COMPTABLE.monthlyPriceCents / 100,
);

/** Plancher honoraires annuels lettre de mission TPE. */
export const COMPTABLE_ANNUAL_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesAnnuelsMinCents / 100,
);

export const COMPTABLE_PONCTUEL_MIN = Math.round(
  COMMERCIAL_COMPTABLE.honorairesPonctuelMinCents / 100,
);

export const COMPTABLE_ANNUAL_TYPICAL = Math.round(
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesCents / 100,
);

export const COMPTABLE_FACTURATION_MODES = [
  "monthly_12",
  "quarterly",
  "annual",
  "variable",
] as const;

export type ComptableFacturationMode = (typeof COMPTABLE_FACTURATION_MODES)[number];

export const COMPTABLE_SOCIAL_PAIE_MODES = [
  "included",
  "separate",
  "not_offered",
] as const;

export type ComptableSocialPaieMode = (typeof COMPTABLE_SOCIAL_PAIE_MODES)[number];

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
    min: COMPTABLE_ANNUAL_MIN,
    max: 12_000,
    step: 100,
    unit: "eur_year" as const,
    defaultValue: COMPTABLE_ANNUAL_TYPICAL,
  },
  ponctuelMin: {
    min: COMPTABLE_PONCTUEL_MIN,
    max: 5_000,
    step: 100,
    unit: "eur" as const,
    defaultValue: COMPTABLE_PONCTUEL_MIN,
  },
  herculeCapacity: {
    min: 1,
    max: 15,
    step: 1,
    unit: "count" as const,
    defaultValue: 1,
  },
} satisfies Record<string, SalesSliderConfig>;

export const COMPTABLE_SLIDER_CONFIGS = BASE_SLIDER_CONFIGS;

const annualFloorLabel = formatSliderLabel(COMPTABLE_ANNUAL_MIN, "eur_year");

export const COMPTABLE_SALES_QUESTIONS: SalesQuestion[] = [
  {
    id: "q1",
    number: 1,
    sectionId: "capacite",
    type: "multi",
    maxSelections: 3,
    prompt: "Quelles missions votre cabinet propose-t-il actuellement ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "web_creation", label: "Tenue comptable générale" },
      { id: "ecommerce", label: "Comptabilité e-commerce / marketplace" },
      { id: "seo", label: "Social / paie / DSN" },
      { id: "google_ads", label: "Fiscal / liasse fiscale" },
      { id: "meta_ads", label: "Juridique des sociétés (création, modification)" },
      { id: "dev", label: "Conseil en gestion / pilotage" },
      { id: "nocode", label: "Audit / commissariat aux comptes" },
      { id: "shopify", label: "Consolidation / groupe" },
      { id: "maintenance", label: "Obligations déclaratives récurrentes" },
      { id: "consulting", label: "Conseil fiscal / patrimonial" },
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
    prompt: "Quels sont vos principaux domaines d'expertise ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "paid_acquisition", label: "Fiscalité des entreprises" },
      { id: "organic_seo", label: "Social / paie" },
      { id: "design_ux", label: "Juridique des sociétés" },
      { id: "frontend", label: "Tenue comptable TPE" },
      { id: "backend", label: "Tenue comptable PME" },
      { id: "ecommerce", label: "E-commerce / activités digitales" },
      { id: "automation", label: "Outils digitaux / intégrations" },
      { id: "branding", label: "Transmission / cession" },
      { id: "consulting", label: "Conseil en gestion" },
      { id: "other", label: "Autre spécialité proposée par le cabinet" },
    ],
  },
  {
    id: "q3",
    number: 3,
    sectionId: "capacite",
    type: "slider",
    prompt: "Combien de nouveaux dossiers pouvez-vous actuellement accepter par mois ?",
    description: "Dossiers par mois.",
    slider: COMPTABLE_SLIDER_CONFIGS.projectCapacity,
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
      { id: "variable", label: "Variable selon le type de dossier" },
    ],
  },
  {
    id: "q5",
    number: 5,
    sectionId: "capacite",
    type: "single",
    prompt:
      "Quel est votre délai habituel pour démarrer un nouveau dossier après validation ?",
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
      "Au cours des 12 derniers mois, combien de dossiers ont connu un retard significatif ?",
    description: "Nombre de dossiers en retard.",
    slider: COMPTABLE_SLIDER_CONFIGS.delayCount,
  },
  {
    id: "q7",
    number: 7,
    sectionId: "historique",
    type: "slider",
    prompt:
      "Au cours des 12 derniers mois, combien de clients avez-vous perdus en raison d'un problème lié à la mission ?",
    description: "Nombre de clients perdus.",
    slider: COMPTABLE_SLIDER_CONFIGS.lostClients,
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
      { id: "delays", label: "Retards de production / clôture" },
      { id: "technical", label: "Problèmes outils / logiciels" },
      { id: "communication", label: "Communication / suivi client" },
      { id: "scope", label: "Périmètre du dossier mal défini" },
      { id: "availability", label: "Manque de disponibilité de l'équipe" },
      { id: "external", label: "Dépendance à des prestataires externes" },
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
      "Lorsqu'un dossier dépasse votre capacité disponible, quelle solution utilisez-vous généralement ?",
    options: [
      { id: "refuse", label: "Nous refusons le dossier" },
      { id: "delay", label: "Nous reportons son démarrage" },
      { id: "freelance", label: "Nous faisons appel à des collaborateurs externes" },
      { id: "outsource", label: "Nous sous-traitons une partie du dossier" },
      { id: "hire", label: "Nous recrutons / renforçons temporairement l'équipe" },
      { id: "depends", label: "Cela dépend du dossier" },
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
    prompt: COMPTABLE_Q21_PROMPT,
    description: COMPTABLE_Q21_DESCRIPTION,
    options: COMPTABLE_DIFFERENTIATOR_OPTIONS.map((option) => ({ ...option })),
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
          "Reprise de tenue et obligations d'un indépendant ou libéral (BNC/BIC), volume limité, relation directe avec le dirigeant.",
      },
      {
        id: "tpe",
        label: "TPE — 1 à 10 salariés",
        helpTitle: "TPE — 1 à 10 salariés",
        helpText:
          "Tenue comptable, TVA et social léger. Dirigeant souvent saturé, honoraires au plancher cabinet.",
      },
      {
        id: "pme_small",
        label: "PME — 11 à 50 salariés",
        helpTitle: "PME — 11 à 50 salariés",
        helpText:
          "Dossiers plus structurés (paie, multi-établissements). Tenue, fiscal et obligations administratives.",
      },
      {
        id: "pme_medium",
        label: "PME — 51 à 250 salariés",
        helpTitle: "PME — 51 à 250 salariés",
        helpText:
          "Dossiers plus structurés (paie, multi-établissements). Tenue, fiscal et obligations administratives.",
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
    prompt: "Quel niveau de complexité de dossier souhaitez-vous principalement traiter ?",
    options: [
      {
        id: "simple",
        label: "Dossiers simples / standardisés",
        helpTitle: "Dossiers simples / standardisés",
        helpText:
          "Régime simplifié, peu d'écritures, process répétitif (TVA standard, liasse peu spécifique).",
      },
      {
        id: "intermediate",
        label: "Dossiers intermédiaires",
        helpTitle: "Dossiers intermédiaires",
        helpText:
          "Volume moyen, quelques spécificités (TVA, social de base, reprise simple).",
      },
      {
        id: "complex",
        label: "Dossiers complexes",
        helpTitle: "Dossiers complexes",
        helpText:
          "Multi-activités, reprise de dossier, restructurations légères, plusieurs établissements.",
      },
      {
        id: "technical",
        label: "Dossiers à forte composante réglementaire",
        helpTitle: "Dossiers à forte composante réglementaire",
        helpText:
          "Fiscal avancé, social/paie structuré, liasse et obligations lourdes.",
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
      "Quel montant minimum d'honoraires annuels acceptez-vous pour une lettre de mission de tenue ({clientSegment}) ?",
    description: `Plancher marché : ${annualFloorLabel} / an.`,
    slider: COMPTABLE_SLIDER_CONFIGS.annualMin,
  },
  {
    id: "q14",
    number: 15,
    sectionId: "standards",
    type: "single",
    prompt: "Comment facturez-vous habituellement vos lettres de mission de tenue ?",
    description: "Modalité de facturation — pas la durée du contrat.",
    options: [
      { id: "monthly_12", label: "Mensualisé (12 acomptes)" },
      { id: "quarterly", label: "Trimestriel" },
      { id: "annual", label: "Annuel" },
      { id: "variable", label: "Selon le dossier" },
    ],
  },
  {
    id: "q15",
    number: 16,
    sectionId: "conditions",
    type: "single",
    prompt: "Comment traitez-vous le social / paie pour vos dossiers {clientSegment} ?",
    options: [
      { id: "included", label: "Inclus dans la lettre de mission de tenue" },
      { id: "separate", label: "Facturé à part (forfait annuel social / paie)" },
      { id: "not_offered", label: "Non proposé" },
    ],
  },
  {
    id: "q16",
    number: 17,
    sectionId: "conditions",
    type: "slider",
    prompt:
      "Quel montant minimum d'honoraires facturez-vous pour une mission ponctuelle (création, reprise hors tenue, conseil) ?",
    description: "Création, reprise, conseil — hors lettre de mission annuelle.",
    slider: COMPTABLE_SLIDER_CONFIGS.ponctuelMin,
    optOutLabel: "Toujours packagée dans la lettre annuelle",
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
      { id: "one_off", label: "Missions ponctuelles (création, conseil)" },
      { id: "recurring", label: "Lettres de mission annuelles de tenue" },
      { id: "redesign", label: "Reprises de dossier" },
      { id: "ecommerce", label: "Dossiers e-commerce / digital" },
      { id: "acquisition", label: "Missions fiscales" },
      { id: "seo", label: "Missions social / paie" },
      { id: "development", label: "Missions juridiques" },
      { id: "maintenance", label: "Obligations déclaratives" },
      { id: "high_value", label: "Dossiers à honoraires élevés" },
    ],
  },
  {
    id: "q20",
    number: 19,
    sectionId: "conditions",
    type: "slider",
    prompt: "Quelle capacité souhaitez-vous réserver aux missions {clientSegment} provenant d'Hercule ?",
    description: "Dossiers par mois réservés à Hercule.",
    slider: COMPTABLE_SLIDER_CONFIGS.herculeCapacity,
  },
];
