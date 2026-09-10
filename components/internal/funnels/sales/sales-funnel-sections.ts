import type { Audience } from "@/lib/admin/navigation";

export type SalesFunnelSectionId =
  | "rendez-vous"
  | "introduction"
  | "objectifs"
  | "presentation-societe"
  | "capacite"
  | "historique"
  | "standards"
  | "conditions";

export type SalesFunnelSection = {
  id: SalesFunnelSectionId;
  label: string;
  title: string;
  subtitle?: string;
  duration?: string;
  hasIntroCheckbox?: boolean;
};

const AGENCE_SALES_FUNNEL_SECTIONS: SalesFunnelSection[] = [
  {
    id: "rendez-vous",
    label: "Rendez-vous",
    title: "Rendez-vous",
  },
  {
    id: "introduction",
    label: "Audit de compatibilité",
    title: "Avant-propos",
    duration: "Durée : 20min",
    subtitle:
      "Avant de commencer, quelques informations nous permettront d'évaluer votre profil et de vous orienter vers les opportunités les plus adaptées.",
    hasIntroCheckbox: true,
  },
  {
    id: "objectifs",
    label: "Objectifs",
    title: "Objectifs & douleur",
    subtitle:
      "Comprendre la situation actuelle, la capacité disponible et l'écart avec l'objectif avant de présenter Hercule.",
  },
  {
    id: "presentation-societe",
    label: "Présentation de la société",
    title: "Présentation de la société",
    subtitle:
      "Découvrez Hercule, notre modèle et l'équipe avant de poursuivre la qualification.",
  },
  {
    id: "capacite",
    label: "Capacité opérationnelle",
    title: "Capacité opérationnelle",
    subtitle:
      "Évaluez votre capacité actuelle à prendre en charge de nouveaux projets, de l'affectation à la livraison.",
  },
  {
    id: "historique",
    label: "Historique & fiabilité",
    title: "Historique & fiabilité",
    subtitle:
      "Évaluez la fiabilité opérationnelle de votre agence sur les 12 derniers mois.",
  },
  {
    id: "standards",
    label: "Expertise & positionnement",
    title: "Expertise & positionnement commercial",
    subtitle:
      "Précisez votre positionnement client, vos tickets minimums et votre économie de contrat.",
  },
  {
    id: "conditions",
    label: "Conditions commerciales",
    title: "Conditions commerciales",
    subtitle:
      "Indiquez vos conditions d'engagement et les opportunités que vous souhaitez prioriser.",
  },
];

const COMPTABLE_SALES_FUNNEL_SECTIONS: SalesFunnelSection[] = [
  {
    id: "rendez-vous",
    label: "Rendez-vous",
    title: "Rendez-vous",
  },
  {
    id: "introduction",
    label: "Audit de compatibilité",
    title: "Avant-propos",
    duration: "Durée : 20min",
    subtitle:
      "Avant de commencer, quelques informations nous permettront d'évaluer votre cabinet et de vous orienter vers les missions TPE les plus adaptées.",
    hasIntroCheckbox: true,
  },
  {
    id: "objectifs",
    label: "Objectifs",
    title: "Objectifs & douleur",
    subtitle:
      "Comprendre la situation actuelle, la capacité disponible pour de nouveaux dossiers TPE et l'écart avec l'objectif avant de présenter Hercule Comptable.",
  },
  {
    id: "presentation-societe",
    label: "Présentation de la société",
    title: "Présentation de la société",
    subtitle:
      "Découvrez Hercule Comptable, notre modèle et la provision Calendly / Zoom avant de poursuivre la qualification.",
  },
  {
    id: "capacite",
    label: "Capacité opérationnelle",
    title: "Capacité opérationnelle",
    subtitle:
      "Évaluez votre capacité actuelle à prendre en charge de nouveaux dossiers TPE — tenue, fiscal et obligations administratives.",
  },
  {
    id: "historique",
    label: "Historique & fiabilité",
    title: "Historique & fiabilité",
    subtitle:
      "Évaluez la fiabilité opérationnelle de votre cabinet sur les 12 derniers mois (honorés RDV, no-shows, reprises de dossiers).",
  },
  {
    id: "standards",
    label: "Expertise & honoraires",
    title: "Expertise & honoraires",
    subtitle:
      "Précisez votre zone, vos honoraires typiques, votre typologie de missions et votre ticket dossier minimum.",
  },
  {
    id: "conditions",
    label: "Conditions commerciales",
    title: "Conditions commerciales",
    subtitle:
      "Lite 998 €, Hercule Starter 1 499 €/mois, pack 3 598 € — garantie MRR Starter — et les missions que vous souhaitez prioriser.",
  },
];

/** @deprecated Use getSalesFunnelSections(audience) */
export const SALES_FUNNEL_SECTIONS = AGENCE_SALES_FUNNEL_SECTIONS;

export const INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les opportunités qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

export const PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de la société Hercule et des conditions générales de vente.";

const COMPTABLE_INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les missions TPE qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

const COMPTABLE_PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de Hercule Comptable et des conditions générales de vente.";

export function getIntroConfirmationText(audience: Audience = "agence"): string {
  return audience === "comptable"
    ? COMPTABLE_INTRO_CONFIRMATION_TEXT
    : INTRO_CONFIRMATION_TEXT;
}

export function getPresentationConfirmationText(audience: Audience = "agence"): string {
  return audience === "comptable"
    ? COMPTABLE_PRESENTATION_CONFIRMATION_TEXT
    : PRESENTATION_CONFIRMATION_TEXT;
}

export function getSalesFunnelSections(audience: Audience): SalesFunnelSection[] {
  if (audience === "comptable") {
    return COMPTABLE_SALES_FUNNEL_SECTIONS;
  }
  return AGENCE_SALES_FUNNEL_SECTIONS;
}

export function getSalesFunnelSection(
  id: SalesFunnelSectionId,
  audience: Audience = "agence",
): SalesFunnelSection | undefined {
  return getSalesFunnelSections(audience).find((section) => section.id === id);
}
