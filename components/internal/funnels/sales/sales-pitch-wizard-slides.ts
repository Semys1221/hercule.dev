import {
  FOUNDATION_PRESENTATION_MIRROR_TEMPLATE,
  FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_PRESENTATION_MIRROR_TEMPLATE,
  CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
} from "@/lib/admin/funnels/cif-sales-copy";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { PitchWizardStepId } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { Audience } from "@/lib/admin/navigation";

export type PitchSlideType =
  | "transition"
  | "company"
  | "product_origin"
  | "decision_makers"
  | "acknowledgment"
  | "cgv"
  | "pillars_overview"
  | "pillar_content"
  | "comparison_buyin"
  | "foundation_buyin"
  | "activation_buyin"
  | "partner_future"
  | "roi_contract"
  | "faq_close"
  | "dashboard_link"
  | "pricing_close";

export type PitchSlideDefinition = {
  id: PitchWizardStepId;
  type: PitchSlideType;
  title: string;
  coachCue?: string;
  trainingNote?: string;
};

export { PITCH_P0_TRANSITION_TEMPLATE as PITCH_P0_TRANSITION_SCRIPT } from "@/lib/admin/funnels/sales-pitch-bleed-copy";

export const PITCH_PART1_OPENING_SCRIPT =
  "[Prénom], on va présenter Hercule au cabinet, le cadre du partenariat, puis le système en trois volets. À la fin, on répond aux questions et on choisit l'infrastructure adaptée à la zone. On y va ?";

export const PITCH_P2_PROMPT =
  "Y a-t-il quelqu'un d'autre qui devrait voir ça aujourd'hui ?";

export const PITCH_P2_OPTIONS = [
  { id: "all_present", label: "Toutes les personnes décisionnaires sont présentes" },
  { id: "missing", label: "Un associé / décideur manque" },
] as const;

export const PITCH_BUYIN_OPTIONS = [
  { id: "clear", label: "C'est clair — on continue" },
  { id: "questions", label: "Le cabinet a des questions (traiter avant Suivant)" },
] as const;

export const PITCH_P11_TEMP_OPTIONS = [
  { id: "yes", label: "Oui — c'est la bonne solution" },
  { id: "hesitant", label: "Le cabinet a encore des doutes" },
] as const;

export const PITCH_CGV_HIGHLIGHTS = [
  {
    title: "Exclusivité",
    description: "1 cabinet / zone — verrou posé à l'activation",
  },
  {
    title: "SLA",
    description:
      "Toute demande inbound répondue sous 24 h — sinon garantie suspendue",
  },
  {
    title: "Garantie",
    description: "5 000 € de récurrent cumulé sur 90 jours (Horizon)",
  },
  {
    title: "Commission",
    description: "0 % sur les honoraires",
  },
  {
    title: "Session",
    description: "Activation et paiement pendant cette session d'audit",
  },
] as const;

export const PITCH_PILLARS = [
  {
    name: "Hercule Capture",
    tagline: "Intercepter l'intention au moment du besoin légal",
  },
  {
    name: "Hercule Engine",
    tagline: "Déployer le système en 60 jours — live, mesurable",
  },
  {
    name: "Hercule Partner",
    tagline: "Pilotage, appels, responsabilité des deux côtés",
  },
] as const;

export const PITCH_FAQ_ITEMS = [
  {
    id: "payment",
    title: "Paiement pendant la session",
    body:
      "Foundation consomme une bande passante réelle sur les flux légaux de l'État. Pour préserver l'exclusivité, un seul cabinet est connecté par zone. Sans activation pendant la session, la zone redevient disponible. D'autres cabinets ont un audit sur ce secteur cette semaine. Si l'un active avant, la file se ferme 12 mois.",
  },
  {
    id: "partner",
    title: "Associé",
    body:
      "Le cabinet a déclaré {honoraires} et un écart {gap}. Horizon est couvert par 5 000 € de récurrent cumulé sur 90 jours. L'associé valide un ROI contractuel sur un actif de zone, pas un achat de fiches.",
  },
  {
    id: "think",
    title: "Je dois réfléchir",
    body:
      "La réflexion est légitime. Si le cabinet doit traiter {cause} et que l'écart {gap} est réel, chaque jour sans verrou laisse la zone à un confrère — ou à une agence SEO sans garantie.",
  },
] as const;

export function getPitchAudienceLabel(audience: Audience): string {
  if (isCifSalesAudience(audience)) {
    return "Hercule CIF";
  }
  return "Hercule Comptable";
}

export function getPitchMirrorTemplate(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? CIF_FOUNDATION_PRESENTATION_MIRROR_TEMPLATE
    : FOUNDATION_PRESENTATION_MIRROR_TEMPLATE;
}

export function getPitchDifferentiationParagraph(audience: Audience): string {
  const paragraphs = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS
    : FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS;
  return paragraphs[0] ?? "";
}

export function getPitchCgvHref(audience: Audience): string {
  return isCifSalesAudience(audience) ? "/cvg/conseil-financier" : "/cvg";
}

export function getPitchCgvLabel(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Conditions générales de vente CIF"
    : "Conditions générales de vente";
}

export function getPitchSlides(audience: Audience): PitchSlideDefinition[] {
  return [
    {
      id: "p0",
      type: "transition",
      title: "Transition",
      coachCue: "Transition vers la présentation structurée du partenariat Hercule.",
    },
    {
      id: "p1",
      type: "company",
      title: "Logo & équipe",
      coachCue:
        "Présentation de l'entreprise Hercule — identité et équipe, hors détail technique du système.",
    },
    {
      id: "p1b",
      type: "product_origin",
      title: "2018 → 2026 — le système Hercule",
      coachCue:
        "Évolution du système Hercule de 2018 à aujourd'hui : d'outil interne à infrastructure déployée.",
    },
    {
      id: "p2",
      type: "decision_makers",
      title: "Support belief",
      coachCue:
        "Validation que les décideurs nécessaires sont présents avant la suite de la présentation.",
    },
    {
      id: "p3",
      type: "acknowledgment",
      title: "Différenciation courte",
      coachCue:
        "Positionnement différenciant du cabinet face aux alternatives du marché.",
    },
    {
      id: "pCgv",
      type: "cgv",
      title: "Conditions CGV",
    },
    {
      id: "p4",
      type: "pillars_overview",
      title: "Le système Hercule",
      coachCue:
        "Trois piliers : capture, exécution et relation partenaire — présentés séquentiellement.",
    },
    {
      id: "p5",
      type: "pillar_content",
      title: "Hercule Capture (1/2)",
    },
    {
      id: "p6",
      type: "comparison_buyin",
      title: "Hercule Capture (2/2)",
    },
    {
      id: "p7",
      type: "foundation_buyin",
      title: "Les 2 premiers mois — fondations du cabinet",
      coachCue:
        "Phase de déploiement sur 60 jours : fondations marketing du cabinet, sans engagement de volume.",
    },
    {
      id: "p8",
      type: "activation_buyin",
      title: "Mois 3 — système live",
      coachCue:
        "Activation à J+60 ; fenêtre garantie de 90 jours à compter de l'activation — deux échéances distinctes.",
    },
    {
      id: "p9",
      type: "pillar_content",
      title: "Hercule Partner (1/2)",
    },
    {
      id: "p10",
      type: "partner_future",
      title: "Hercule Partner (2/2)",
    },
    {
      id: "pRoi",
      type: "roi_contract",
      title: "ROI contractuel",
      coachCue:
        "Investissement 90 jours : 7 197 € · garantie 5 000 € de récurrent · valeur année 1 : 60 000 €.",
    },
    {
      id: "p11",
      type: "faq_close",
      title: "Questions ?",
    },
    {
      id: "p12",
      type: "pricing_close",
      title: "Choix d'infrastructure",
    },
    {
      id: "pDashboard",
      type: "dashboard_link",
      title: "Lien dashboard",
      coachCue:
        "Lien dashboard pour finaliser le choix de formule et le paiement en autonomie.",
    },
  ];
}

export function getPitchSlide(
  stepId: PitchWizardStepId,
  audience: Audience,
): PitchSlideDefinition | undefined {
  return getPitchSlides(audience).find((slide) => slide.id === stepId);
}
