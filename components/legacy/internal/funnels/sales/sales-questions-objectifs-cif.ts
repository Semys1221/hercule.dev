import {
  B5_METHOD_OPTIONS,
  B6_TRAP_TEMPLATE,
  B8_GAP_OPTIONS,
  CABINET_OBJECTIFS_SUBTITLE,
  DIAGNOSTIC_MIRROR_TEMPLATE,
} from "@/lib/legacy/admin/funnels/sales-bleed-tunnel";

import type { SalesQuestion } from "./sales-questions";

export { CABINET_OBJECTIFS_SUBTITLE };

export const CIF_OBJECTIFS_QUESTIONS: SalesQuestion[] = [
  {
    id: "b1",
    number: 1,
    sectionId: "objectifs",
    type: "single",
    prompt: "Sur les 12 prochains mois, quelle est la priorité du cabinet ?",
    coachCue: "Noté — on chiffre tout à l'écran sur cette base.",
    options: [
      { id: "more_dossiers", label: "Plus de mandats / études" },
      { id: "better_quality", label: "Des mandats de meilleure qualité (patrimoine / ticket)" },
      { id: "monthly_growth", label: "Croissance mensuelle du récurrent conseil" },
    ],
  },
  {
    id: "b2",
    number: 2,
    sectionId: "objectifs",
    type: "slider",
    prompt: "Le cabinet est à combien aujourd'hui ?",
    slider: { min: 0, max: 15, step: 1, unit: "count", defaultValue: 3 },
  },
  {
    id: "b3",
    number: 3,
    sectionId: "objectifs",
    type: "single",
    prompt: "Le cabinet est en activité depuis…",
    coachCue: "Ça nous servira pour le diagnostic — pas un jugement.",
    options: [
      { id: "y2015", label: "Avant 2017" },
      { id: "y2017", label: "2017 – 2019" },
      { id: "y2020", label: "2020 – 2021" },
      { id: "y2022", label: "2022 – 2023" },
      { id: "y2024", label: "2024 ou après" },
    ],
  },
  {
    id: "b4",
    number: 4,
    sectionId: "objectifs",
    type: "slider",
    prompt: "Chiffrer l'objectif H à 12 mois — la cible que le cabinet vise.",
    slider: { min: 0, max: 15, step: 1, unit: "count", defaultValue: 6 },
  },
  {
    id: "b5",
    number: 5,
    sectionId: "objectifs",
    type: "multi",
    maxSelections: 2,
    prompt:
      "Quelles méthodes le cabinet utilise aujourd'hui pour développer le portefeuille ?",
    description: "Jusqu'à 2 réponses.",
    options: B5_METHOD_OPTIONS.map((option) => ({ ...option })),
  },
  {
    id: "b5b",
    number: 6,
    sectionId: "objectifs",
    type: "single",
    prompt:
      "Parmi ce que le cabinet a coché, quel levier pèse le plus sur les résultats actuels ?",
    visibleWhen: { field: "b5", op: "lengthGt", value: 1 },
    options: [],
  },
  {
    id: "b6",
    number: 7,
    sectionId: "objectifs",
    type: "acknowledgment",
    prompt: "Constat",
    trapTemplate: B6_TRAP_TEMPLATE,
  },
  {
    id: "b7",
    number: 8,
    sectionId: "objectifs",
    type: "single",
    prompt: "Qu'est-ce qui bride {method} pour le cabinet ?",
    options: [],
  },
  {
    id: "b8",
    number: 9,
    sectionId: "objectifs",
    type: "single",
    prompt:
      "Si dans 6 mois l'écart entre {goal} et {current} est le même, qu'est-ce que ça fait à la marge et à l'occupation du cabinet ?",
    options: B8_GAP_OPTIONS.map((option) => ({ ...option })),
  },
  {
    id: "diagnostic_card",
    number: 10,
    sectionId: "objectifs",
    type: "diagnostic_card",
    prompt: "Diagnostic signé",
    mirrorTemplate: DIAGNOSTIC_MIRROR_TEMPLATE,
    checkboxLabel:
      "Le cabinet valide ce cadre pour la suite de l'audit de compatibilité.",
  },
];
