export type SalesFunnelSectionId =
  | "rendez-vous"
  | "introduction"
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

export const SALES_FUNNEL_SECTIONS: SalesFunnelSection[] = [
  {
    id: "rendez-vous",
    label: "Rendez-vous",
    title: "Rendez-vous",
  },
  {
    id: "introduction",
    label: "Audit de compatibilité",
    title: "Audit de compatibilité",
    duration: "Durée : 20min",
    subtitle:
      "Avant de commencer, quelques informations nous permettront d'évaluer votre profil et de vous orienter vers les opportunités les plus adaptées.",
    hasIntroCheckbox: true,
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

export const INTRO_CONFIRMATION_TEXT =
  "Je confirme fournir des réponses honnêtes et précises afin que les opportunités qui me sont proposées correspondent au mieux à mon expertise, ma capacité et mes conditions de collaboration.";

export const PRESENTATION_CONFIRMATION_TEXT =
  "J'ai pris connaissance de la présentation de la société Hercule et des conditions générales de vente.";

export function getSalesFunnelSection(
  id: SalesFunnelSectionId,
): SalesFunnelSection | undefined {
  return SALES_FUNNEL_SECTIONS.find((section) => section.id === id);
}
