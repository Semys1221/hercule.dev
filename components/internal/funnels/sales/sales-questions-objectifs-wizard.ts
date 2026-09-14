import { B3_YEAR_MAP, B5_METHOD_OPTIONS, B8_GAP_OPTIONS } from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  W8_CRITERIA_OPTIONS,
  W8_TRIED_OPTIONS,
  W11_METHOD_DURATION_OPTIONS,
  W14_TIMELINE_OPTIONS,
  W15_WAIT_OPTIONS,
  W16_URGENCY_OPTIONS,
  W17_SYNTHESIS_TEMPLATE,
  W9_TRAP_TEMPLATE,
  WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
  WIZARD_OBJECTIFS_SUBTITLE,
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

function mapAudienceOptions<T extends { labelCif: string; labelComptable: string }>(
  options: readonly T[],
  audience: Audience,
): Array<{ id: string; label: string }> {
  const isCif = isCifSalesAudience(audience);
  return options.map((option) => ({
    id: option.id,
    label: isCif ? option.labelCif : option.labelComptable,
  }));
}

export function getWizardObjectifsQuestions(audience: Audience): SalesQuestion[] {
  const isCif = isCifSalesAudience(audience);
  return [
    {
      id: "w1",
      number: 1,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quel est votre objectif ?",
      coachCue: "Noté — on chiffre tout à l'écran sur cette base.",
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
      prompt: isCif ? "Quelle est l'encours ?" : "Quel est le chiffre d'affaires annuel ?",
      slider: isCif
        ? { min: 1_000_000, max: 500_000_000, step: 1_000_000, unit: "eur", defaultValue: 10_000_000 }
        : { min: 50_000, max: 5_000_000, step: 10_000, unit: "eur", defaultValue: 300_000 },
    },
    {
      id: "w4",
      number: 4,
      sectionId: "objectifs",
      type: "slider",
      prompt: isCif
        ? "Quel est le nombre de transformations qui vous conviennent par mois ?"
        : "Quel est le nombre de dossiers qui vous conviennent par mois ?",
      slider: { min: 0, max: 20, step: 1, unit: "count", defaultValue: 2 },
    },
    {
      id: "w5",
      number: 5,
      sectionId: "objectifs",
      type: "slider",
      prompt: isCif
        ? "Vous souhaiteriez dans 6 mois être à quelle encours ?"
        : "Vous souhaiteriez dans 6 mois être à quel chiffre d'affaires annuel ?",
      coachCue:
        "Pensez marge et occupation du cabinet — pas seulement le chiffre affiché.",
      slider: isCif
        ? { min: 1_000_000, max: 500_000_000, step: 1_000_000, unit: "eur", defaultValue: 15_000_000 }
        : { min: 50_000, max: 5_000_000, step: 10_000, unit: "eur", defaultValue: 500_000 },
    },
    {
      id: "w6",
      number: 6,
      sectionId: "objectifs",
      type: "slider",
      prompt: isCif
        ? "Vous souhaiteriez effectuer combien de transformations qui vous conviennent par mois ?"
        : "Vous souhaiteriez effectuer combien de dossiers qui vous conviennent par mois ?",
      coachCue: "Chaque mandat / dossier en plus doit être rentable pour le cabinet.",
      slider: { min: 0, max: 20, step: 1, unit: "count", defaultValue: 4 },
    },
    {
      id: "w7",
      number: 7,
      sectionId: "objectifs",
      type: "slider",
      prompt: "Vous souhaiteriez être à combien de clients dans 6 mois ?",
      slider: { min: 0, max: 500, step: 1, unit: "count", defaultValue: 80 },
    },
    {
      id: "w8",
      number: 8,
      sectionId: "objectifs",
      type: "single",
      prompt: "Quelle est votre méthode actuelle d'acquisition ?",
      options: B5_METHOD_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w8Tried",
      number: 9,
      sectionId: "objectifs",
      type: "single",
      prompt: "Avez-vous déjà exploré d'autres solutions pour combler cet écart ?",
      options: W8_TRIED_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w8TriedWho",
      number: 10,
      sectionId: "objectifs",
      type: "text",
      prompt: "Qui ou quoi avez-vous regardé / testé ?",
      placeholder: "Ex. agence SEO locale, plateforme d'apporteurs, réseau confrère…",
    },
    {
      id: "w8Criteria",
      number: 11,
      sectionId: "objectifs",
      type: "multi",
      prompt: "Quelles sont les 3 qualités idéales d'un partenaire pour votre cabinet ?",
      description: "Choisissez 1 à 3 critères.",
      options: W8_CRITERIA_OPTIONS.map((option) => ({ ...option })),
      maxSelections: 3,
    },
    {
      id: "w8Brake",
      number: 12,
      sectionId: "objectifs",
      type: "single",
      prompt: "Qu'est-ce qui bride {method} pour le cabinet ?",
      options: [],
    },
    {
      id: "w9",
      number: 9,
      sectionId: "objectifs",
      type: "acknowledgment",
      prompt: "Constat",
      trapTemplate: W9_TRAP_TEMPLATE,
    },
    {
      id: "w10",
      number: 10,
      sectionId: "objectifs",
      type: "single",
      prompt: "Votre cabinet est en exercice depuis quand ?",
      coachCue: "Ça nous servira pour le diagnostic — pas un jugement.",
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
      number: 11,
      sectionId: "objectifs",
      type: "single",
      prompt: "Depuis quand utilisez-vous {method} ?",
      options: W11_METHOD_DURATION_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w12",
      number: 12,
      sectionId: "objectifs",
      type: "confirmation_mirror",
      prompt: "Confirmez que votre objectif à 6 mois est :",
      mirrorTemplate: "{goalSummary}",
      checkboxLabel: "Le cabinet confirme cet objectif à 6 mois.",
    },
    {
      id: "w13",
      number: 13,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Est-ce que vous considérez que {method} va vous permettre d'atteindre cet objectif en 6 mois ?",
      options: [
        { id: "yes", label: "Oui" },
        { id: "no", label: "Non" },
      ],
    },
    {
      id: "w13Why",
      number: 14,
      sectionId: "objectifs",
      type: "text",
      prompt: "Pourquoi ?",
      description: "Minimum 10 caractères si la réponse précédente est « Non ».",
    },
    {
      id: "w14",
      number: 15,
      sectionId: "objectifs",
      type: "single",
      prompt: "En combien de temps pensez-vous que {method} y arriverait ?",
      options: W14_TIMELINE_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w15",
      number: 16,
      sectionId: "objectifs",
      type: "single",
      prompt: "Souhaitez-vous attendre ?",
      options: W15_WAIT_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16",
      number: 17,
      sectionId: "objectifs",
      type: "single",
      prompt: "Pourquoi ne pouvez-vous pas attendre ?",
      options: W16_URGENCY_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w16Detail",
      number: 18,
      sectionId: "objectifs",
      type: "text",
      prompt: "Précisez l'urgence",
    },
    {
      id: "w18",
      number: 19,
      sectionId: "objectifs",
      type: "single",
      prompt:
        "Si dans 6 mois l'écart entre {goal6m} et {currentSnapshot} est le même, qu'est-ce que ça fait à la marge et à l'occupation du cabinet ?",
      coachCue: "Pas de jugement — on cadrer le coût du statu quo.",
      options: B8_GAP_OPTIONS.map((option) => ({ ...option })),
    },
    {
      id: "w17",
      number: 20,
      sectionId: "objectifs",
      type: "acknowledgment",
      prompt: "Synthèse",
      trapTemplate: W17_SYNTHESIS_TEMPLATE,
      checkboxLabel: "Le cabinet confirme cette synthèse.",
    },
    {
      id: "diagnostic_card",
      number: 20,
      sectionId: "objectifs",
      type: "diagnostic_card",
      prompt: "Diagnostic signé",
      mirrorTemplate: WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE,
      checkboxLabel:
        "Le cabinet valide ce cadre pour la suite de l'audit de compatibilité.",
    },
  ];
}
