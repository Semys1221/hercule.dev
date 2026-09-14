import type { Audience } from "@/lib/admin/navigation";
import {
  interpolateClientSegment,
  type ClientSegment,
} from "@/lib/admin/funnels/client-segment";
import { SLIDERS_SECTION_SUBTITLE } from "@/lib/admin/funnels/sales-sliders";
import { SESSION_SECTION_SYSTEM_LABEL } from "@/lib/admin/funnels/ui-copy";
import {
  isCabinetBuyerSalesAudience,
  isCifSalesAudience,
  isComptableSalesAudience,
} from "@/lib/admin/funnels/sales-audience";

export type SalesFunnelSectionId =
  | "rendez-vous"
  | "introduction"
  | "objectifs"
  | "pitch"
  | "sliders"
  | "mapping"
  | "presentation-societe"
  | "capacite"
  | "standards"
  | "conditions";

export const PITCH_WIZARD_SECTION_SUBTITLE =
  "Présentation Hercule, cadre contractuel, système en trois piliers, ROI contractuel et choix d'infrastructure.";

export type SalesFunnelSection = {
  id: SalesFunnelSectionId;
  label: string;
  title: string;
  subtitle?: string;
  duration?: string;
  hasIntroCheckbox?: boolean;
  documentationOnly?: boolean;
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
    label: "Avant-propos",
    title: "Avant-propos",
    duration: "Durée : 20min",
    subtitle: "Cadre de l'audit de compatibilité avant la qualification détaillée.",
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
    id: "pitch",
    label: SESSION_SECTION_SYSTEM_LABEL,
    title: SESSION_SECTION_SYSTEM_LABEL,
    subtitle: PITCH_WIZARD_SECTION_SUBTITLE,
  },
  {
    id: "sliders",
    label: "Sliders",
    title: "Sliders",
    subtitle: SLIDERS_SECTION_SUBTITLE,
  },
  {
    id: "mapping",
    label: "Mapping",
    title: "Mapping",
    subtitle: "Arbre de logique conditionnelle — documentation uniquement.",
    documentationOnly: true,
  },
];

const CIF_SALES_FUNNEL_SECTIONS: SalesFunnelSection[] = [
  {
    id: "rendez-vous",
    label: "Rendez-vous",
    title: "Rendez-vous",
  },
  {
    id: "introduction",
    label: "Avant-propos",
    title: "Avant-propos",
    duration: "Durée : 20min",
    subtitle: "Avant d'entrer dans le fond, posons le cadre de cet échange.",
    hasIntroCheckbox: true,
  },
  {
    id: "objectifs",
    label: "Objectifs",
    title: "Objectifs",
    subtitle:
      "Comprendre la situation actuelle, la capacité disponible et l'écart avec l'objectif avant de présenter Hercule CIF.",
  },
  {
    id: "pitch",
    label: SESSION_SECTION_SYSTEM_LABEL,
    title: SESSION_SECTION_SYSTEM_LABEL,
    subtitle: PITCH_WIZARD_SECTION_SUBTITLE,
  },
  {
    id: "sliders",
    label: "Sliders",
    title: "Sliders",
    subtitle: SLIDERS_SECTION_SUBTITLE,
  },
  {
    id: "mapping",
    label: "Mapping",
    title: "Mapping",
    subtitle: "Arbre de logique conditionnelle — documentation uniquement.",
    documentationOnly: true,
  },
];

/** @deprecated Use getSalesFunnelSections(audience) */
export const SALES_FUNNEL_SECTIONS = AGENCE_SALES_FUNNEL_SECTIONS;

export const INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les opportunités qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

export const PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de la société Hercule et des conditions générales de vente.";

const CIF_INTRO_CONFIRMATION_TEXT =
  "Le cabinet confirme fournir des réponses honnêtes et précises afin que les mandats {clientSegment} proposés correspondent au mieux à son périmètre, sa capacité et ses conditions de collaboration.";

const COMPTABLE_INTRO_CONFIRMATION_TEXT =
  "Le cabinet confirme fournir des réponses honnêtes et précises afin que les missions {clientSegment} proposées correspondent au mieux à son périmètre, sa capacité et ses conditions de collaboration.";

const COMPTABLE_PRESENTATION_CONFIRMATION_TEXT =
  "Le cabinet confirme avoir pris connaissance de la présentation de Hercule Comptable et des conditions générales de vente.";

const CIF_PRESENTATION_CONFIRMATION_TEXT =
  "Le cabinet confirme avoir pris connaissance de la présentation de Hercule CIF et des conditions générales de vente.";

export function getIntroConfirmationText(
  audience: Audience = "agence",
  clientSegment?: ClientSegment,
): string {
  if (isCifSalesAudience(audience)) {
    return clientSegment
      ? interpolateClientSegment(CIF_INTRO_CONFIRMATION_TEXT, clientSegment)
      : CIF_INTRO_CONFIRMATION_TEXT.replace("{clientSegment}", "TPE");
  }
  if (isComptableSalesAudience(audience)) {
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
  const sections = isCifSalesAudience(audience)
    ? CIF_SALES_FUNNEL_SECTIONS
    : isCabinetBuyerSalesAudience(audience)
      ? COMPTABLE_SALES_FUNNEL_SECTIONS
      : AGENCE_SALES_FUNNEL_SECTIONS;

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
