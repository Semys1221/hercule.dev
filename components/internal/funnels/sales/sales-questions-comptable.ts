import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import type { SalesQuestion, SalesSliderConfig, SalesSliderUnit } from "./sales-questions";

export const COMPTABLE_MONTHLY_MIN = Math.round(
  COMMERCIAL_COMPTABLE.monthlyPriceCents / 100,
);

const countFormatter = new Intl.NumberFormat("fr-FR");

function formatSliderLabel(value: number, unit: SalesSliderUnit): string {
  const formatted = countFormatter.format(value);
  switch (unit) {
    case "eur":
      return `${formatted} €`;
    case "eur_month":
      return `${formatted} € / mois`;
    case "months":
      return value === 1 ? "1 mois" : `${formatted} mois`;
    case "count":
      return formatted;
  }
}

function comptableSlider(
  base: SalesSliderConfig,
  min = COMPTABLE_MONTHLY_MIN,
): SalesSliderConfig {
  if (base.unit === "eur" || base.unit === "eur_month") {
    return {
      ...base,
      min,
      defaultValue: Math.max(base.defaultValue, min),
    };
  }
  return base;
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
  oneTimeMin: {
    min: COMPTABLE_MONTHLY_MIN,
    max: 20_000,
    step: 250,
    unit: "eur" as const,
    defaultValue: COMPTABLE_MONTHLY_MIN,
  },
  monthlyMin: {
    min: COMPTABLE_MONTHLY_MIN,
    max: 15_000,
    step: 250,
    unit: "eur_month" as const,
    defaultValue: COMPTABLE_MONTHLY_MIN,
  },
  paidAdsDuration: {
    min: 1,
    max: 24,
    step: 1,
    unit: "months" as const,
    defaultValue: 3,
  },
  seoDuration: {
    min: 3,
    max: 24,
    step: 1,
    unit: "months" as const,
    defaultValue: 6,
  },
  herculeCapacity: {
    min: 1,
    max: 15,
    step: 1,
    unit: "count" as const,
    defaultValue: 1,
  },
} satisfies Record<string, SalesSliderConfig>;

export const COMPTABLE_SLIDER_CONFIGS = {
  projectCapacity: BASE_SLIDER_CONFIGS.projectCapacity,
  delayCount: BASE_SLIDER_CONFIGS.delayCount,
  lostClients: BASE_SLIDER_CONFIGS.lostClients,
  oneTimeMin: comptableSlider(BASE_SLIDER_CONFIGS.oneTimeMin),
  monthlyMin: comptableSlider(BASE_SLIDER_CONFIGS.monthlyMin),
  paidAdsDuration: BASE_SLIDER_CONFIGS.paidAdsDuration,
  seoDuration: BASE_SLIDER_CONFIGS.seoDuration,
  herculeCapacity: BASE_SLIDER_CONFIGS.herculeCapacity,
} satisfies Record<string, SalesSliderConfig>;

const floorLabel = formatSliderLabel(COMPTABLE_MONTHLY_MIN, "eur");
const floorMonthlyLabel = formatSliderLabel(COMPTABLE_MONTHLY_MIN, "eur_month");

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
    prompt: "Combien de nouveaux dossiers TPE pouvez-vous actuellement accepter par mois ?",
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
      { id: "client", label: "Difficultés liées au dirigeant TPE" },
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
    id: "q11",
    number: 11,
    sectionId: "standards",
    type: "multi",
    maxSelections: 3,
    prompt: "Quels types de dirigeants TPE souhaitez-vous principalement accompagner ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "freelancers", label: "Indépendants / professions libérales" },
      { id: "tpe", label: "TPE — 1 à 10 salariés" },
      { id: "pme_small", label: "PME — 11 à 50 salariés" },
      { id: "pme_medium", label: "PME — 51 à 250 salariés" },
      { id: "eti", label: "ETI — 251 à 500 salariés" },
      { id: "enterprise", label: "Grandes structures — 500+ salariés" },
    ],
  },
  {
    id: "q12",
    number: 12,
    sectionId: "standards",
    type: "single",
    prompt: "Quel niveau de complexité de dossier souhaitez-vous principalement traiter ?",
    options: [
      { id: "simple", label: "Dossiers simples / standardisés" },
      { id: "intermediate", label: "Dossiers intermédiaires" },
      { id: "complex", label: "Dossiers complexes" },
      { id: "technical", label: "Dossiers à forte composante réglementaire" },
      { id: "all", label: "Tous niveaux" },
    ],
  },
  {
    id: "q13",
    number: 13,
    sectionId: "standards",
    type: "slider",
    prompt:
      "Quel montant minimum d'honoraires souhaitez-vous généralement facturer pour une mission ponctuelle ?",
    description: `Minimum Hercule : ${floorLabel}.`,
    slider: COMPTABLE_SLIDER_CONFIGS.oneTimeMin,
    optOutLabel: "Je ne propose pas de mission ponctuelle",
  },
  {
    id: "q14",
    number: 14,
    sectionId: "standards",
    type: "slider_matrix",
    prompt: "Quel niveau d'honoraires recherchez-vous pour une mission récurrente de tenue ?",
    description: `Indiquez le montant mensuel minimum pour chaque durée (plancher ${floorMonthlyLabel}).`,
    subQuestions: [
      { id: "months3", label: "3 mois" },
      { id: "months6", label: "6 mois" },
      { id: "months12", label: "12 mois" },
    ],
    slider: COMPTABLE_SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q15",
    number: 15,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    prompt:
      "Pour une mission fiscale récurrente, quel budget mensuel minimum considérez-vous comme pertinent ?",
    description: "Fiscal — ignorez si votre cabinet ne propose pas cette mission.",
    slider: COMPTABLE_SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q16",
    number: 16,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    dependsOn: "q15",
    prompt:
      "Pour une mission fiscale, quelle durée d'engagement vous semble généralement nécessaire ?",
    description: "Fiscal — ignorez si votre cabinet ne propose pas cette mission.",
    slider: COMPTABLE_SLIDER_CONFIGS.paidAdsDuration,
  },
  {
    id: "q17",
    number: 17,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    prompt:
      "Pour une mission social / paie, quel budget mensuel minimum considérez-vous comme pertinent ?",
    description: "Social / paie — ignorez si votre cabinet ne propose pas cette mission.",
    slider: COMPTABLE_SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q18",
    number: 18,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    dependsOn: "q17",
    prompt:
      "Pour une mission social / paie, quelle durée d'engagement vous semble généralement nécessaire ?",
    description: "Social / paie — ignorez si votre cabinet ne propose pas cette mission.",
    slider: COMPTABLE_SLIDER_CONFIGS.seoDuration,
  },
  {
    id: "q19",
    number: 19,
    sectionId: "conditions",
    type: "multi",
    maxSelections: 3,
    prompt: "Quels types de missions TPE souhaitez-vous recevoir en priorité ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "one_off", label: "Missions ponctuelles" },
      { id: "recurring", label: "Missions récurrentes de tenue" },
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
    number: 20,
    sectionId: "conditions",
    type: "slider",
    prompt: "Quelle capacité souhaitez-vous réserver aux missions TPE provenant d'Hercule ?",
    description: "Dossiers par mois réservés à Hercule.",
    slider: COMPTABLE_SLIDER_CONFIGS.herculeCapacity,
  },
];
