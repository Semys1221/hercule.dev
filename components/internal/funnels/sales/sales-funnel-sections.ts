import type { Audience } from "@/lib/admin/navigation";
import {
  interpolateClientSegment,
  type ClientSegment,
} from "@/lib/admin/funnels/client-segment";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";

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
    title: "Objectifs",
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
      "Avant de commencer, quelques informations nous permettront d'évaluer votre cabinet et de vous orienter vers les missions {clientSegment} les plus adaptées.",
    hasIntroCheckbox: true,
  },
  {
    id: "objectifs",
    label: "Objectifs",
    title: "Objectifs",
    subtitle:
      "Comprendre la situation actuelle, la capacité disponible et l'écart avec l'objectif avant de présenter Hercule Comptable.",
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
      "Évaluez votre capacité actuelle à prendre en charge de nouveaux dossiers {clientSegment} — tenue, fiscal et obligations administratives.",
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
    label: "Modèle différenciant",
    title: "Modèle différenciant",
    subtitle:
      "Ce qui distingue votre cabinet d'un expert-comptable déjà en place, puis vos honoraires.",
  },
  {
    id: "conditions",
    label: "Conditions commerciales",
    title: "Conditions commerciales",
    subtitle:
      "Social / paie, missions ponctuelles, formules Hercule (Lite 998 €/mois, Starter 1 499 €/mois, pack 3 598 €) et priorités de dossiers.",
  },
];

/** @deprecated Use getSalesFunnelSections(audience) */
export const SALES_FUNNEL_SECTIONS = AGENCE_SALES_FUNNEL_SECTIONS;

export const INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les opportunités qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

export const PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de la société Hercule et des conditions générales de vente.";

const COMPTABLE_INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les missions {clientSegment} qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

const COMPTABLE_PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de Hercule Comptable et des conditions générales de vente.";

const CIF_PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de Hercule CIF et des conditions générales de vente.";

export function getIntroConfirmationText(
  audience: Audience = "agence",
  clientSegment?: ClientSegment,
): string {
  if (isCabinetBuyerSalesAudience(audience)) {
    return clientSegment
      ? interpolateClientSegment(COMPTABLE_INTRO_CONFIRMATION_TEXT, clientSegment)
      : COMPTABLE_INTRO_CONFIRMATION_TEXT.replace("{clientSegment}", "TPE");
  }
  return INTRO_CONFIRMATION_TEXT;
}

export function getPresentationConfirmationText(audience: Audience = "agence"): string {
  if (audience === "cif") {
    return CIF_PRESENTATION_CONFIRMATION_TEXT;
  }
  return audience === "comptable"
    ? COMPTABLE_PRESENTATION_CONFIRMATION_TEXT
    : PRESENTATION_CONFIRMATION_TEXT;
}

export function getSalesFunnelSections(
  audience: Audience,
  clientSegment?: ClientSegment,
): SalesFunnelSection[] {
  const sections =
    isCabinetBuyerSalesAudience(audience) ? COMPTABLE_SALES_FUNNEL_SECTIONS : AGENCE_SALES_FUNNEL_SECTIONS;

  if (!isCabinetBuyerSalesAudience(audience) || !clientSegment) {
    return sections;
  }

  return sections.map((section) => ({
    ...section,
    subtitle: section.subtitle
      ? interpolateClientSegment(section.subtitle, clientSegment)
      : undefined,
  }));
}

export function getSalesFunnelSection(
  id: SalesFunnelSectionId,
  audience: Audience = "agence",
  clientSegment?: ClientSegment,
): SalesFunnelSection | undefined {
  return getSalesFunnelSections(audience, clientSegment).find((section) => section.id === id);
}
