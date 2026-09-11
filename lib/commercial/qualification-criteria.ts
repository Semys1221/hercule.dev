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

export const COMPTABLE_QUALIFICATION_CRITERIA: readonly QualificationCriterion[] = [
  {
    key: "taille",
    title: "Profil TPE",
    description:
      "Dirigeant indépendant ou TPE avec un besoin de reprise comptable, fiscale ou administrative compatible avec votre cabinet.",
  },
  {
    key: "dureeSouhaitee",
    title: "Horizon de mission",
    description:
      "Adéquation entre la durée de la mission de tenue et votre capacité d'absorption de dossiers.",
  },
  {
    key: "horizonResultat",
    title: "Urgence / échéances",
    description:
      "Échéances fiscales ou administratives cohérentes avec une mise en relation utile.",
  },
  {
    key: "budget",
    title: "Honoraires",
    description:
      "Enveloppe d'honoraires validée lors de la Live Qualification téléphonique.",
  },
  {
    key: "historiqueAgences",
    title: "Historique comptable",
    description:
      "Parcours antérieur avec des cabinets ou experts-comptables, pour calibrer la pertinence du match.",
  },
];

export const COMPTABLE_DEMANDE_VERSO_CRITERIA = COMPTABLE_QUALIFICATION_CRITERIA.filter(
  (criterion) => criterion.key !== "taille" && criterion.key !== "budget",
);

export const CIF_QUALIFICATION_CRITERIA: readonly QualificationCriterion[] = [
  {
    key: "taille",
    title: "Profil PME",
    description:
      "Dirigeant indépendant ou PME avec un besoin d'optimisation fiscale, de trésorerie ou de patrimoine compatible avec votre cabinet.",
  },
  {
    key: "dureeSouhaitee",
    title: "Horizon de mission",
    description:
      "Adéquation entre la durée de l'accompagnement (fiscal, trésorerie, patrimoine) et votre capacité d'absorption de dossiers.",
  },
  {
    key: "horizonResultat",
    title: "Urgence / échéances",
    description:
      "Échéances fiscales ou de trésorerie cohérentes avec une mise en relation utile.",
  },
  {
    key: "budget",
    title: "Honoraires",
    description:
      "Enveloppe d'honoraires validée lors de la Live Qualification téléphonique.",
  },
  {
    key: "historiqueAgences",
    title: "Historique conseil",
    description:
      "Parcours antérieur avec un CIF, une banque privée ou un CGP, pour calibrer la pertinence du match.",
  },
];

export const CIF_DEMANDE_VERSO_CRITERIA = CIF_QUALIFICATION_CRITERIA.filter(
  (criterion) => criterion.key !== "taille" && criterion.key !== "budget",
);

export function getEnterpriseQualificationCriteria(
  audience: "agence" | "entreprise" | "comptable" | "cif" = "agence",
): readonly QualificationCriterion[] {
  if (audience === "cif") {
    return CIF_QUALIFICATION_CRITERIA;
  }
  if (audience === "comptable") {
    return COMPTABLE_QUALIFICATION_CRITERIA;
  }
  return ENTERPRISE_QUALIFICATION_CRITERIA;
}

export type DemandeVersoFields = {
  dureeSouhaitee: string;
  horizonResultat: string;
  historiqueAgences: string;
};
