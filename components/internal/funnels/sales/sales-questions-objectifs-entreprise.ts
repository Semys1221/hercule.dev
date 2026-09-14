import { LINEAR_DIAGNOSTIC_MIRROR_TEMPLATE } from "@/lib/admin/funnels/sales-bleed-copy";

import type { SalesQuestion } from "./sales-questions";

export const ENTREPRISE_OBJECTIFS_SUBTITLE =
  "Qualification courte : capacité, écart, ce qui bloque l'activité. On va droit au but.";

export const ENTREPRISE_OBJECTIFS_QUESTIONS: SalesQuestion[] = [
  {
    id: "o1",
    number: 1,
    sectionId: "objectifs",
    type: "multi",
    maxSelections: 2,
    prompt:
      "Quelle est aujourd'hui votre principale difficulté pour atteindre vos objectifs digitaux / web ?",
    description: "Sélectionnez jusqu'à 2 réponses.",
    options: [
      { id: "not_enough_leads", label: "Pas assez de leads ou de demandes entrantes" },
      { id: "low_conversion", label: "Site / parcours client qui ne convertit pas" },
      { id: "low_visibility", label: "Visibilité insuffisante (SEO, SEA, réseaux)" },
      { id: "late_projects", label: "Projets en retard ou mal livrés" },
      { id: "missing_skills", label: "Manque de compétences en interne" },
      { id: "no_roi", label: "Budget investi sans retour mesurable" },
    ],
  },
  {
    id: "o2",
    number: 2,
    sectionId: "objectifs",
    type: "single",
    prompt:
      "Disposez-vous en interne de la capacité pour mener vos projets (équipe, temps, compétences) ?",
    options: [
      { id: "sufficient_misaligned", label: "Oui, capacité suffisante mais mal orientée" },
      { id: "partial_skills", label: "Oui, mais compétences partielles (il manque de l'expertise)" },
      { id: "no_team", label: "Non, pas d'équipe dédiée" },
      { id: "overloaded", label: "Non, équipe débordée sur d'autres priorités" },
      { id: "unknown", label: "Je ne sais pas / pas évalué" },
    ],
  },
  {
    id: "o3",
    number: 3,
    sectionId: "objectifs",
    type: "single",
    prompt: "Quelle est la principale raison de cette situation ?",
    coachCue:
      "{business} coche {cause}. Depuis combien de temps cet écart pèse sur les objectifs digitaux ?",
    options: [
      { id: "other_priorities", label: "Priorités internes ailleurs (production, commercial…)" },
      { id: "slow_hiring", label: "Recrutement impossible ou trop lent" },
      { id: "bad_providers", label: "Prestataires actuels décevants" },
      { id: "no_strategy", label: "Manque de vision / stratégie claire" },
      { id: "budget", label: "Budget insuffisant ou mal alloué" },
      { id: "past_bad_experience", label: "Peur de l'investissement / mauvaises expériences passées" },
    ],
  },
  {
    id: "o4",
    number: 4,
    sectionId: "objectifs",
    type: "multi",
    maxSelections: 3,
    prompt:
      "Parmi ces freins, lequel bride le plus la capacité de {business} sur les 6 prochains mois ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "no_strategy", label: "Pas de stratégie digitale claire" },
      { id: "underperforming_provider", label: "Prestataire actuel sous-performant" },
      { id: "internal_blockers", label: "Projets bloqués en interne (validation, ressources)" },
      { id: "wrong_stack", label: "Outils / stack inadaptés" },
      { id: "no_reporting", label: "Manque de suivi et de reporting" },
      { id: "competition_ahead", label: "Concurrence qui nous devance" },
      { id: "no_action", label: "Aucune action structurée en cours" },
    ],
  },
  {
    id: "o5",
    number: 5,
    sectionId: "objectifs",
    type: "multi",
    maxSelections: 3,
    prompt: "Qu'avez-vous déjà essayé pour résoudre ce problème ?",
    description: "Sélectionnez jusqu'à 3 réponses.",
    options: [
      { id: "agency_freelance", label: "Agence / freelance (projet ponctuel)" },
      { id: "internal_team", label: "Équipe interne / stagiaire" },
      { id: "self_serve_ads", label: "Publicité payante en autonomie" },
      { id: "site_redesign", label: "Refonte site avec un prestataire" },
      { id: "multiple_providers", label: "Plusieurs prestataires sans coordination" },
      { id: "nothing_structured", label: "Rien de structuré jusqu'ici" },
    ],
  },
  {
    id: "o6",
    number: 6,
    sectionId: "objectifs",
    type: "single",
    prompt:
      "Quel écart observez-vous entre votre scénario idéal (objectifs atteints) et votre réalité actuelle ?",
    coachCue:
      "Si dans 6 mois l'écart est le même : qu'est-ce que ça fait au budget et à l'occupation de {business} ?",
    showCoachCueWhen: ["major_gap", "significant_gap"],
    options: [
      { id: "major_gap", label: "Écart majeur : résultats très en deçà des attentes" },
      { id: "significant_gap", label: "Écart significatif : progrès lents" },
      { id: "moderate_gap", label: "Écart modéré : proche mais insuffisant" },
      { id: "near_target", label: "Proche de l'objectif" },
      { id: "at_target", label: "Objectifs déjà atteints" },
      { id: "no_target", label: "Pas d'objectif chiffré défini" },
    ],
  },
  {
    id: "diagnostic_card",
    number: 7,
    sectionId: "objectifs",
    type: "diagnostic_card",
    prompt: "Diagnostic mentionné",
    mirrorTemplate: LINEAR_DIAGNOSTIC_MIRROR_TEMPLATE,
    checkboxLabel:
      "L'activité valide ce cadre pour la suite de l'audit de compatibilité.",
  },
];
