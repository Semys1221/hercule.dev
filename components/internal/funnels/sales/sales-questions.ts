import type { SalesFunnelSectionId } from "./sales-funnel-sections";

export const HERCULE_MONTHLY_MIN = 1500;

export type SalesQuestionOption = {
  id: string;
  label: string;
  disabled?: boolean;
  helpTitle?: string;
  helpText?: string;
};

export type SalesSliderUnit = "count" | "eur" | "eur_month" | "eur_year" | "months";

export type SalesSliderConfig = {
  min: number;
  max: number;
  step: number;
  unit: SalesSliderUnit;
  defaultValue: number;
};

export type SalesMatrixSubQuestion = {
  id: "months3" | "months6" | "months12";
  label: string;
};

type SalesQuestionBase = {
  id: string;
  number: number;
  prompt: string;
  description?: string;
  sectionId: Exclude<SalesFunnelSectionId, "rendez-vous">;
};

export type SalesSingleQuestion = SalesQuestionBase & {
  type: "single";
  options: SalesQuestionOption[];
};

export type SalesMultiQuestion = SalesQuestionBase & {
  type: "multi";
  options: SalesQuestionOption[];
  maxSelections: number;
  exclusiveOptionId?: string;
  hasOtherInput?: boolean;
  otherInputFieldId?: string;
};

export type SalesSliderQuestion = SalesQuestionBase & {
  type: "slider";
  slider: SalesSliderConfig;
  optOutLabel?: string;
};

export type SalesSliderMatrixQuestion = SalesQuestionBase & {
  type: "slider_matrix";
  subQuestions: SalesMatrixSubQuestion[];
  slider: SalesSliderConfig;
};

export type SalesConditionalSliderQuestion = SalesQuestionBase & {
  type: "conditional_slider";
  slider: SalesSliderConfig;
  skipLabel: string;
  dependsOn?: string;
};

export type SalesQuestion =
  | SalesSingleQuestion
  | SalesMultiQuestion
  | SalesSliderQuestion
  | SalesSliderMatrixQuestion
  | SalesConditionalSliderQuestion;

export const SLIDER_CONFIGS = {
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
    min: HERCULE_MONTHLY_MIN,
    max: 20_000,
    step: 250,
    unit: "eur" as const,
    defaultValue: HERCULE_MONTHLY_MIN,
  },
  monthlyMin: {
    min: HERCULE_MONTHLY_MIN,
    max: 15_000,
    step: 250,
    unit: "eur_month" as const,
    defaultValue: HERCULE_MONTHLY_MIN,
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

const countFormatter = new Intl.NumberFormat("fr-FR");

export function formatSliderLabel(value: number, unit: SalesSliderUnit): string {
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

export function formatSliderRange(config: SalesSliderConfig): string {
  return `${formatSliderLabel(config.min, config.unit)} – ${formatSliderLabel(config.max, config.unit)}`;
}

/** @deprecated Use getSalesQuestions(audience) */
export const SALES_QUESTIONS: SalesQuestion[] = [
  {
    id: "q1",
    number: 1,
    sectionId: "capacite",
    type: "multi",
    maxSelections: 3,
    prompt: "Quels services votre agence propose-t-elle actuellement ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "web_creation", label: "Création / refonte de sites web" },
      { id: "ecommerce", label: "E-commerce" },
      { id: "seo", label: "SEO / référencement naturel" },
      { id: "google_ads", label: "Google Ads / SEA" },
      { id: "meta_ads", label: "Meta Ads / Social Ads" },
      { id: "dev", label: "Développement web / logiciel" },
      { id: "nocode", label: "Webflow / No-Code" },
      { id: "shopify", label: "Shopify" },
      { id: "maintenance", label: "Maintenance / support technique" },
      { id: "consulting", label: "Conseil / stratégie" },
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
      { id: "paid_acquisition", label: "Acquisition payante" },
      { id: "organic_seo", label: "Acquisition organique / SEO" },
      { id: "design_ux", label: "Design / UX-UI" },
      { id: "frontend", label: "Développement Front-End" },
      { id: "backend", label: "Développement Back-End" },
      { id: "ecommerce", label: "E-commerce" },
      { id: "automation", label: "Automatisation / intégration" },
      { id: "branding", label: "Branding / identité" },
      { id: "consulting", label: "Conseil / stratégie" },
      { id: "other", label: "Autre spécialité proposée par l'agence" },
    ],
  },
  {
    id: "q3",
    number: 3,
    sectionId: "capacite",
    type: "slider",
    prompt: "Combien de nouveaux projets pouvez-vous actuellement accepter par mois ?",
    description: "Projets par mois.",
    slider: SLIDER_CONFIGS.projectCapacity,
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
      { id: "variable", label: "Variable selon le type de projet" },
    ],
  },
  {
    id: "q5",
    number: 5,
    sectionId: "capacite",
    type: "single",
    prompt:
      "Quel est votre délai habituel pour démarrer un nouveau projet après validation ?",
    options: [
      { id: "lt_48h", label: "Moins de 48 heures" },
      { id: "2_5_days", label: "2 à 5 jours" },
      { id: "1_2_weeks", label: "1 à 2 semaines" },
      { id: "gt_2_weeks", label: "Plus de 2 semaines" },
      { id: "variable", label: "Variable selon le projet" },
    ],
  },
  {
    id: "q6",
    number: 6,
    sectionId: "historique",
    type: "slider",
    prompt:
      "Au cours des 12 derniers mois, combien de projets ont connu un retard significatif ?",
    description: "Nombre de projets en retard.",
    slider: SLIDER_CONFIGS.delayCount,
  },
  {
    id: "q7",
    number: 7,
    sectionId: "historique",
    type: "slider",
    prompt:
      "Au cours des 12 derniers mois, combien de clients avez-vous perdus en raison d'un problème lié à la prestation ?",
    description: "Nombre de clients perdus.",
    slider: SLIDER_CONFIGS.lostClients,
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
      { id: "delays", label: "Retards de production" },
      { id: "technical", label: "Problèmes techniques" },
      { id: "communication", label: "Communication / suivi client" },
      { id: "scope", label: "Périmètre du projet mal défini" },
      { id: "availability", label: "Manque de disponibilité de l'équipe" },
      { id: "external", label: "Dépendance à des prestataires externes" },
      { id: "client", label: "Difficultés liées au client" },
      { id: "none", label: "Aucune difficulté significative" },
    ],
  },
  {
    id: "q9",
    number: 9,
    sectionId: "historique",
    type: "single",
    prompt:
      "Lorsqu'un projet dépasse votre capacité disponible, quelle solution utilisez-vous généralement ?",
    options: [
      { id: "refuse", label: "Nous refusons le projet" },
      { id: "delay", label: "Nous reportons son démarrage" },
      { id: "freelance", label: "Nous faisons appel à des freelances / partenaires" },
      { id: "outsource", label: "Nous sous-traitons une partie du projet" },
      { id: "hire", label: "Nous recrutons / renforçons temporairement l'équipe" },
      { id: "depends", label: "Cela dépend du projet" },
    ],
  },
  {
    id: "q10",
    number: 10,
    sectionId: "historique",
    type: "single",
    prompt:
      "Disposez-vous de processus internes standardisés pour vos prestations principales ?",
    options: [
      { id: "all", label: "Oui, pour toutes nos prestations" },
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
    prompt: "Quels types de clients souhaitez-vous principalement accompagner ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "freelancers", label: "Indépendants / professions libérales" },
      { id: "tpe", label: "TPE — 1 à 10 salariés" },
      { id: "pme_small", label: "PME — 11 à 50 salariés" },
      { id: "pme_medium", label: "PME — 51 à 250 salariés" },
      { id: "eti", label: "ETI — 251 à 500 salariés" },
      { id: "enterprise", label: "Grandes entreprises — 500+ salariés" },
    ],
  },
  {
    id: "q12",
    number: 12,
    sectionId: "standards",
    type: "single",
    prompt: "Quel niveau de complexité de projet souhaitez-vous principalement traiter ?",
    options: [
      { id: "simple", label: "Projets simples / standardisés" },
      { id: "intermediate", label: "Projets intermédiaires" },
      { id: "complex", label: "Projets complexes" },
      { id: "technical", label: "Projets à forte composante technique" },
      { id: "all", label: "Tous niveaux" },
    ],
  },
  {
    id: "q13",
    number: 13,
    sectionId: "standards",
    type: "slider",
    prompt:
      "Quel montant minimum souhaitez-vous généralement facturer pour une prestation ponctuelle ?",
    description: `Minimum Hercule : ${formatSliderLabel(HERCULE_MONTHLY_MIN, "eur")}.`,
    slider: SLIDER_CONFIGS.oneTimeMin,
    optOutLabel: "Je ne propose pas de prestation ponctuelle",
  },
  {
    id: "q14",
    number: 14,
    sectionId: "standards",
    type: "slider_matrix",
    prompt: "Quel niveau de rémunération recherchez-vous pour un contrat récurrent ?",
    description: `Indiquez le montant mensuel minimum pour chaque durée (plancher ${formatSliderLabel(HERCULE_MONTHLY_MIN, "eur_month")}).`,
    subQuestions: [
      { id: "months3", label: "3 mois" },
      { id: "months6", label: "6 mois" },
      { id: "months12", label: "12 mois" },
    ],
    slider: SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q15",
    number: 15,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    prompt:
      "Pour une prestation de Paid Ads, quel budget mensuel minimum considérez-vous comme pertinent pour un client ?",
    description: "Paid Ads — ignorez si votre agence ne propose pas cette prestation.",
    slider: SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q16",
    number: 16,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    dependsOn: "q15",
    prompt:
      "Pour une prestation de Paid Ads, quelle durée d'engagement vous semble généralement nécessaire ?",
    description: "Paid Ads — ignorez si votre agence ne propose pas cette prestation.",
    slider: SLIDER_CONFIGS.paidAdsDuration,
  },
  {
    id: "q17",
    number: 17,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    prompt:
      "Pour une prestation organique / SEO, quel budget mensuel minimum considérez-vous comme pertinent pour un client ?",
    description: "SEO — ignorez si votre agence ne propose pas cette prestation.",
    slider: SLIDER_CONFIGS.monthlyMin,
  },
  {
    id: "q18",
    number: 18,
    sectionId: "conditions",
    type: "conditional_slider",
    skipLabel: "Cela ne me concerne pas",
    dependsOn: "q17",
    prompt:
      "Pour une prestation organique / SEO, quelle durée d'engagement vous semble généralement nécessaire ?",
    description: "SEO — ignorez si votre agence ne propose pas cette prestation.",
    slider: SLIDER_CONFIGS.seoDuration,
  },
  {
    id: "q19",
    number: 19,
    sectionId: "conditions",
    type: "multi",
    maxSelections: 3,
    prompt: "Quels types d'opportunités souhaitez-vous recevoir en priorité ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "one_off", label: "Prestations ponctuelles" },
      { id: "recurring", label: "Contrats récurrents" },
      { id: "redesign", label: "Projets de refonte" },
      { id: "ecommerce", label: "Projets e-commerce" },
      { id: "acquisition", label: "Missions d'acquisition" },
      { id: "seo", label: "Missions SEO / organiques" },
      { id: "development", label: "Missions de développement" },
      { id: "maintenance", label: "Missions de maintenance" },
      { id: "high_value", label: "Projets à forte valeur" },
    ],
  },
  {
    id: "q20",
    number: 20,
    sectionId: "conditions",
    type: "slider",
    prompt: "Quelle capacité souhaitez-vous réserver aux opportunités provenant d'Hercule ?",
    description: "Projets par mois réservés à Hercule.",
    slider: SLIDER_CONFIGS.herculeCapacity,
  },
];

import type { Audience } from "@/lib/admin/navigation";
import { isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";
import {
  COMPTABLE_MONTHLY_MIN,
  COMPTABLE_SALES_QUESTIONS,
  COMPTABLE_SLIDER_CONFIGS,
} from "./sales-questions-comptable";
import {
  COMPTABLE_MONTHLY_MIN as CIF_MONTHLY_MIN,
  COMPTABLE_SALES_QUESTIONS as CIF_SALES_QUESTIONS,
  COMPTABLE_SLIDER_CONFIGS as CIF_SLIDER_CONFIGS,
} from "./sales-questions-cif";
import { AGENCE_OBJECTIFS_QUESTIONS } from "./sales-questions-objectifs-agence";
import { COMPTABLE_OBJECTIFS_QUESTIONS } from "./sales-questions-objectifs-comptable";
import { COMPTABLE_OBJECTIFS_QUESTIONS as CIF_OBJECTIFS_QUESTIONS } from "./sales-questions-objectifs-cif";
import { ENTREPRISE_OBJECTIFS_QUESTIONS } from "./sales-questions-objectifs-entreprise";

export function getHerculeMonthlyMin(audience: Audience = "agence"): number {
  if (audience === "cif") return CIF_MONTHLY_MIN;
  return isComptableSalesAudience(audience) ? COMPTABLE_MONTHLY_MIN : HERCULE_MONTHLY_MIN;
}

export function getSliderConfigs(audience: Audience = "agence") {
  if (audience === "cif") return CIF_SLIDER_CONFIGS;
  return isComptableSalesAudience(audience) ? COMPTABLE_SLIDER_CONFIGS : SLIDER_CONFIGS;
}

function getObjectifsQuestions(audience: Audience): SalesQuestion[] {
  if (audience === "cif") {
    return CIF_OBJECTIFS_QUESTIONS;
  }
  if (isComptableSalesAudience(audience)) {
    return COMPTABLE_OBJECTIFS_QUESTIONS;
  }
  if (audience === "entreprise") {
    return ENTREPRISE_OBJECTIFS_QUESTIONS;
  }
  return AGENCE_OBJECTIFS_QUESTIONS;
}

export function getSalesQuestions(audience: Audience = "agence"): SalesQuestion[] {
  const baseQuestions =
    audience === "cif"
      ? CIF_SALES_QUESTIONS
      : isComptableSalesAudience(audience)
        ? COMPTABLE_SALES_QUESTIONS
        : SALES_QUESTIONS;
  return [...getObjectifsQuestions(audience), ...baseQuestions];
}

export function getSalesQuestionsForSection(
  sectionId: Exclude<SalesFunnelSectionId, "rendez-vous">,
  audience: Audience = "agence",
): SalesQuestion[] {
  return getSalesQuestions(audience).filter((question) => question.sectionId === sectionId);
}

export function getSalesQuestionById(
  id: string,
  audience: Audience = "agence",
): SalesQuestion | undefined {
  return getSalesQuestions(audience).find((question) => question.id === id);
}
