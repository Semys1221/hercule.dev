export type QualificationCriterionKey =
  | "taille"
  | "dureeSouhaitee"
  | "horizonResultat"
  | "budget"
  | "historiqueAgences";

export type QualificationCriterion = {
  key: QualificationCriterionKey;
  title: string;
  description: string;
};

export const ENTERPRISE_QUALIFICATION_CRITERIA: readonly QualificationCriterion[] = [
  {
    key: "taille",
    title: "Taille de l'entreprise",
    description:
      "Profil PME/TPE compatible avec le périmètre d'intervention de nos agences partenaires.",
  },
  {
    key: "dureeSouhaitee",
    title: "Durée souhaitée",
    description:
      "Adéquation entre la durée du projet ou de l'accompagnement et les capacités de l'agence.",
  },
  {
    key: "horizonResultat",
    title: "Horizon de résultat",
    description:
      "Objectifs et délais attendus par l'entreprise, cohérents avec une mise en relation utile.",
  },
  {
    key: "budget",
    title: "Budget",
    description: "Enveloppe budgétaire validée lors de la Live Qualification téléphonique.",
  },
  {
    key: "historiqueAgences",
    title: "Historique avec les agences",
    description:
      "Parcours antérieur avec des prestataires web, pour calibrer la pertinence du match.",
  },
];

export const DEMANDE_VERSO_CRITERIA = ENTERPRISE_QUALIFICATION_CRITERIA.filter(
  (criterion) => criterion.key !== "taille" && criterion.key !== "budget",
);

export type DemandeVersoFields = {
  dureeSouhaitee: string;
  horizonResultat: string;
  historiqueAgences: string;
};
