import { B3_YEAR_MAP, B5_METHOD_OPTIONS } from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  W14_TIMELINE_OPTIONS,
  W15_WAIT_OPTIONS,
  W16_OTHER_OPTIONS,
  W16_RESALE_SUB_OPTIONS,
  W16_STRATEGIC_SUB_OPTIONS,
  W16_URGENCY_OPTIONS,
  W17_SYNTHESIS_TEMPLATE,
  W18_ACCEPTANCE_OPTIONS,
  W_EXCHANGE_WHY_OPTIONS,
  W_EXCHANGE_WHY_PROMPT,
  WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
  WIZARD_OBJECTIFS_SUBTITLE,
  getW3Prompt,
  getW4Prompt,
  getW5Prompt,
  getW6Prompt,
  getW7Prompt,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import type { Audience } from "@/lib/admin/navigation";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";

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
      id: "w8",
      number: 8,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quelle est la méthode d'acquisition du cabinet ?",
      options: B5_METHOD_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w10",
      number: 9,
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
      id: "w12",
      number: 10,
      sectionId: "objectifs",
      type: "confirmation_mirror",
      prompt: "L'objectif à 6 mois du cabinet est :",
      mirrorTemplate: "{goalSummary}",
      checkboxLabel: "Le cabinet confirme cet objectif à 6 mois.",
    },
    {
      id: "w13",
      number: 11,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Qu'est-ce qui vous dérange dans {method} pour atteindre votre objectif en 6 mois ?",
      options: [
        { id: "yes", label: "Oui" },
        { id: "no", label: "Non" },
      ],
    },
    buildExchangeWhyQuestion("wExchangeWhy13", 12),
    {
      id: "w13Why",
      number: 13,
      sectionId: "objectifs",
      type: "single",
      prompt: "Pourquoi {method} ne suffira pas en 6 mois ?",
      options: [],
    },
    {
      id: "w14",
      number: 14,
      sectionId: "objectifs",
      type: "single",
      prompt: "En combien de temps le cabinet estime-t-il que {method} y parviendrait ?",
      options: W14_TIMELINE_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy14", 15),
    {
      id: "w15",
      number: 16,
      sectionId: "objectifs",
      type: "single",
      prompt: "Le cabinet peut-il attendre, ou souhaite-t-il accélérer ?",
      options: W15_WAIT_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy15", 17),
    {
      id: "w16",
      number: 18,
      sectionId: "objectifs",
      type: "single",
      prompt: "Le cabinet a-t-il un impératif qui ne permet pas d'attendre ?",
      options: W16_URGENCY_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16StrategicSub",
      number: 19,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel impératif stratégique pèse sur le cabinet ?",
      options: W16_STRATEGIC_SUB_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16ResaleSub",
      number: 20,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel impératif lié à la revente du cabinet ?",
      options: W16_RESALE_SUB_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16Detail",
      number: 21,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel autre impératif pèse sur le cabinet ?",
      options: W16_OTHER_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w18",
      number: 22,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Si dans 6 mois l'écart entre l'objectif et la situation actuelle est le même, le cabinet le considère-t-il acceptable ?",
      coachCue:
        "Évalue le coût d'acceptation du statu quo si l'écart persiste à 6 mois.",
      options: W18_ACCEPTANCE_OPTIONS.map((option) => ({ ...option })),
    },
    buildExchangeWhyQuestion("wExchangeWhy18", 23),
    {
      id: "w17",
      number: 24,
      sectionId: "objectifs",
      type: "acknowledgment",
      prompt: "Synthèse",
      trapTemplate: W17_SYNTHESIS_TEMPLATE,
      checkboxLabel: "Le cabinet confirme cette synthèse.",
    },
    {
      id: "diagnostic_card",
      number: 25,
      sectionId: "objectifs",
      type: "diagnostic_card",
      prompt: "Diagnostic mentionné",
      mirrorTemplate: WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
      checkboxLabel:
        "Le cabinet valide ce cadre pour la suite de l'audit de compatibilité.",
    },
  ];
}
