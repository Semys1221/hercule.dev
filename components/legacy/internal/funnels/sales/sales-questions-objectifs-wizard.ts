import { B3_YEAR_MAP, B5_METHOD_OPTIONS } from "@/lib/legacy/admin/funnels/sales-bleed-tunnel";
import {
  W14_TIMELINE_OPTIONS,
  W15_WAIT_OPTIONS,
  W16_OTHER_OPTIONS,
  W16_RESALE_SUB_OPTIONS,
  W16_STRATEGIC_SUB_OPTIONS,
  W16_URGENCY_OPTIONS,
  W17_SYNTHESIS_TEMPLATE,
  W8_TRIED_OPTIONS,
  W9_TRAP_TEMPLATE,
  W11_METHOD_AGE_OPTIONS,
  W18_GAP_OPTIONS,
  W_EXCHANGE_WHY_OPTIONS,
  W_EXCHANGE_WHY_PROMPT,
  WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
  WIZARD_OBJECTIFS_SUBTITLE,
  getW8CriteriaOptions,
  getW3Prompt,
  getW4Prompt,
  getW5Prompt,
  getW6Prompt,
  getW7Prompt,
  getW19Prompt,
} from "@/lib/legacy/admin/funnels/sales-objectifs-wizard";
import type { Audience } from "@/lib/legacy/admin/navigation";
import { isCifSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";

import type { SalesQuestion } from "./sales-questions";

export { WIZARD_OBJECTIFS_SUBTITLE };

const W1_OPTIONS = [
  {
    id: "more_volume",
    labelCif: "Plus de mandats / études",
    labelComptable: "Plus de dossiers (volume)",
  },
  {
    id: "better_quality",
    labelCif: "Des mandats de meilleure qualité (patrimoine / ticket)",
    labelComptable: "Des dossiers de meilleure qualité (honoraires / typologie)",
  },
] as const;

function mapAudienceOptions<T extends { id: string; labelCif: string; labelComptable: string }>(
  options: readonly T[],
  audience: Audience,
): Array<{ id: string; label: string }> {
  const isCif = isCifSalesAudience(audience);
  return options.map((option) => ({
    id: option.id,
    label: isCif ? option.labelCif : option.labelComptable,
  }));
}

function buildExchangeWhyQuestion(
  id: "wExchangeWhy13" | "wExchangeWhy14" | "wExchangeWhy15" | "wExchangeWhy18",
  number: number,
): SalesQuestion {
  return {
    id,
    number,
    sectionId: "objectifs",
    type: "single",
    prompt: W_EXCHANGE_WHY_PROMPT,
    coachCue:
      "Réponse déclarative — base pour quantifier l'écart entre objectif et situation actuelle.",
    options: W_EXCHANGE_WHY_OPTIONS.map((option) => ({ ...option })),
  };
}

export function getWizardObjectifsQuestions(audience: Audience): SalesQuestion[] {
  const isCif = isCifSalesAudience(audience);
  return [
    {
      id: "w1",
      number: 1,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel est l'objectif du cabinet ?",
      coachCue: "L'objectif sélectionné structure la projection affichée à l'écran.",
      options: mapAudienceOptions(W1_OPTIONS, audience),
    },
    {
      id: "w2",
      number: 2,
      sectionId: "objectifs",
      type: "slider",
      prompt: "Le cabinet est à combien de clients aujourd'hui ?",
      slider: { min: 0, max: 500, step: 1, unit: "count", defaultValue: 50 },
    },
    {
      id: "w3",
      number: 3,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW3Prompt(audience),
      slider: isCif
        ? { min: 1_000_000, max: 500_000_000, step: 1_000_000, unit: "eur", defaultValue: 10_000_000 }
        : { min: 50_000, max: 5_000_000, step: 10_000, unit: "eur", defaultValue: 300_000 },
    },
    {
      id: "w4",
      number: 4,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW4Prompt({ w1: "more_volume" }, audience),
      slider: { min: 0, max: 20, step: 1, unit: "count", defaultValue: 2 },
    },
    {
      id: "w5",
      number: 5,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW5Prompt(audience),
      coachCue:
        "Honoraires cibles en tenant compte de la marge et de l'occupation du cabinet, pas du chiffre d'affaires seul.",
      slider: isCif
        ? { min: 1_000_000, max: 500_000_000, step: 1_000_000, unit: "eur", defaultValue: 15_000_000 }
        : { min: 50_000, max: 5_000_000, step: 10_000, unit: "eur", defaultValue: 500_000 },
    },
    {
      id: "w6",
      number: 6,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW6Prompt(audience),
      coachCue: isCif
        ? "Chaque mandat en plus doit être rentable pour le cabinet."
        : "Chaque dossier en plus doit être rentable pour le cabinet.",
      slider: { min: 0, max: 20, step: 1, unit: "count", defaultValue: 4 },
    },
    {
      id: "w7",
      number: 7,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW7Prompt(),
      slider: { min: 0, max: 500, step: 1, unit: "count", defaultValue: 80 },
    },
    {
      id: "w19",
      number: 8,
      sectionId: "objectifs",
      type: "slider",
      prompt: getW19Prompt(audience),
      coachCue:
        "Chaque client vaut {ltv}/an. L'écart de {clientGap} clients = {ltvAtStake} sur la trajectoire 6 mois.",
      slider: isCif
        ? { min: 2_400, max: 12_000, step: 100, unit: "eur_year", defaultValue: 3_600 }
        : { min: 2_400, max: 12_000, step: 100, unit: "eur_year", defaultValue: 3_600 },
    },
    {
      id: "w8",
      number: 9,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quelle est la méthode d'acquisition du cabinet ?",
      options: B5_METHOD_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w8Tried",
      number: 10,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Le cabinet a-t-il déjà cherché une autre solution pour développer le portefeuille ?",
      coachCue: "Historique des tentatives — pas un jugement sur le passé.",
      options: W8_TRIED_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w8TriedWho",
      number: 11,
      sectionId: "objectifs",
      type: "text",
      prompt: "Qui a été testé (apporteur, agence, fichier, campagne…) ?",
      coachCue: "Noter le prestataire ou le canal — base pour le diagnostic.",
    },
    {
      id: "w8Brake",
      number: 12,
      sectionId: "objectifs",
      type: "single",
      prompt: "Qu'est-ce qui bride {method} pour le cabinet ?",
      coachCue:
        "Le frein déclaré structure la suite du diagnostic — reformuler si besoin.",
      options: [],
    },
    {
      id: "w9",
      number: 13,
      sectionId: "objectifs",
      type: "acknowledgment",
      prompt: "Constat méthode × objectif",
      trapTemplate: W9_TRAP_TEMPLATE,
      checkboxLabel: "Le cabinet reconnaît ce constat.",
      coachCue:
        "Laisser 10–20 s de silence après lecture. Le cabinet répond à l'oral.",
    },
    {
      id: "w8Criteria",
      number: 14,
      sectionId: "objectifs",
      type: "multi",
      prompt:
        "Quels critères le cabinet exige d'un partenaire pour ne pas revivre ce frein ?",
      description: "Jusqu'à 3 réponses.",
      options: getW8CriteriaOptions(audience),
    },
    {
      id: "w10",
      number: 15,
      sectionId: "objectifs",
      type: "single",
      prompt: "Depuis quand le cabinet est-il en exercice ?",
      coachCue:
        "Ancienneté du cabinet — indicateur contextuel pour le diagnostic, sans valeur de jugement.",
      options: Object.keys(B3_YEAR_MAP).map((id) => ({
        id,
        label:
          id === "y2015"
            ? "Avant 2017"
            : id === "y2017"
              ? "2017 – 2019"
              : id === "y2020"
                ? "2020 – 2021"
                : id === "y2022"
                  ? "2022 – 2023"
                  : "2024 ou après",
      })),
    },
    {
      id: "w11",
      number: 16,
      sectionId: "objectifs",
      type: "single",
      prompt: "Depuis quand le cabinet utilise-t-il {method} ?",
      coachCue:
        "Si {methodAge} dépasse 3 ans avec {brake}, l'écart n'est pas conjoncturel.",
      options: W11_METHOD_AGE_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w12",
      number: 17,
      sectionId: "objectifs",
      type: "confirmation_mirror",
      prompt: "L'objectif à 6 mois du cabinet est :",
      mirrorTemplate: "{goalSummary}",
      checkboxLabel: "Le cabinet confirme cet objectif à 6 mois.",
    },
    {
      id: "w13",
      number: 18,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Le cabinet considère-t-il que {method} lui permettra d'atteindre son objectif en 6 mois ?",
      options: [
        { id: "yes", label: "Oui" },
        { id: "no", label: "Non" },
      ],
    },
    buildExchangeWhyQuestion("wExchangeWhy13", 19),
    {
      id: "w13Why",
      number: 20,
      sectionId: "objectifs",
      type: "single",
      prompt: "Pourquoi {method} ne suffira pas en 6 mois ?",
      options: [],
    },
    {
      id: "w14",
      number: 21,
      sectionId: "objectifs",
      type: "single",
      prompt: "En combien de temps le cabinet estime-t-il que {method} y parviendrait ?",
      options: W14_TIMELINE_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy14", 22),
    {
      id: "w15",
      number: 23,
      sectionId: "objectifs",
      type: "single",
      prompt: "Le cabinet peut-il attendre, ou souhaite-t-il accélérer ?",
      options: W15_WAIT_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy15", 24),
    {
      id: "w16",
      number: 25,
      sectionId: "objectifs",
      type: "single",
      prompt: "Le cabinet a-t-il un impératif qui ne permet pas d'attendre ?",
      options: W16_URGENCY_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16StrategicSub",
      number: 26,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel impératif stratégique pèse sur le cabinet ?",
      options: W16_STRATEGIC_SUB_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16ResaleSub",
      number: 27,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel impératif lié à la revente du cabinet ?",
      options: W16_RESALE_SUB_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16Detail",
      number: 28,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel autre impératif pèse sur le cabinet ?",
      options: W16_OTHER_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w18",
      number: 29,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Si dans 6 mois l'écart entre {goal6m} et {currentSnapshot} est le même, qu'est-ce que ça fait à la marge et à l'occupation du cabinet ?",
      coachCue:
        "Quantifier le coût business du statu quo — pas le stress personnel.",
      options: W18_GAP_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy18", 30),
    {
      id: "w17",
      number: 31,
      sectionId: "objectifs",
      type: "acknowledgment",
      prompt: "Synthèse",
      trapTemplate: W17_SYNTHESIS_TEMPLATE,
      checkboxLabel: "Le cabinet confirme cette synthèse.",
    },
    {
      id: "diagnostic_card",
      number: 32,
      sectionId: "objectifs",
      type: "diagnostic_card",
      prompt: "Diagnostic mentionné",
      mirrorTemplate: WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
      checkboxLabel:
        "Le cabinet valide ce cadre pour la suite de l'audit de compatibilité.",
    },
  ];
}
