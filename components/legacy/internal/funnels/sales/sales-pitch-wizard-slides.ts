import {
  FOUNDATION_PRESENTATION_MIRROR_TEMPLATE,
  FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
} from "@/lib/legacy/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_PRESENTATION_MIRROR_TEMPLATE,
  CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
} from "@/lib/legacy/admin/funnels/cif-sales-copy";
import { isCifSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";
import type { PitchWizardStepId } from "@/lib/legacy/admin/funnels/sales-pitch-wizard";
import type { Audience } from "@/lib/legacy/admin/navigation";

export type PitchSlideType =
  | "transition"
  | "decision_makers"
  | "acknowledgment"
  | "guarantee_hero"
  | "cgv"
  | "pillars_overview"
  | "capture_buyin"
  | "engine_buyin"
  | "partner_buyin"
  | "roi_contract"
  | "faq_close"
  | "dashboard_link";

export type PitchSlideDefinition = {
  id: PitchWizardStepId;
  type: PitchSlideType;
  title: string;
  coachCue?: string;
  trainingNote?: string;
};

export { PITCH_P0_TRANSITION_TEMPLATE as PITCH_P0_TRANSITION_SCRIPT } from "@/lib/legacy/admin/funnels/sales-pitch-bleed-copy";

export const PITCH_PART1_OPENING_SCRIPT =
  "[Prénom], on structure le partenariat : garantie contractuelle, système en trois volets, puis lien dashboard pour finaliser en autonomie. On y va ?";

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
    description: "20 RDV B2B planifiés en 3 mois (Horizon)",
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
      "Le cabinet a déclaré {honoraires} et un écart {gap}. Horizon est couvert par 20 RDV B2B planifiés en 3 mois. L'associé valide un bénéfice contractuel sur un actif de zone, pas un achat de fiches.",
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
      title: "{goal6m} — on y va",
      coachCue: "Transition vers la présentation structurée du partenariat Hercule.",
    },
    {
      id: "p2",
      type: "decision_makers",
      title: "Décideurs présents ?",
      coachCue:
        "Validation que les décideurs nécessaires sont présents avant la suite de la présentation.",
    },
    {
      id: "p3",
      type: "acknowledgment",
      title: "Location → Actif",
      coachCue:
        "Positionnement différenciant du cabinet face aux alternatives du marché.",
    },
    {
      id: "pGuarantee",
      type: "guarantee_hero",
      title: "20 RDV garantis",
      coachCue:
        "Moment hero garantie : 20 RDV B2B planifiés en 3 mois — bénéfice contractuel avant le détail système.",
    },
    {
      id: "pCgv",
      type: "cgv",
      title: "Cadre contractuel",
    },
    {
      id: "p4",
      type: "pillars_overview",
      title: "Le système — 3 piliers",
      coachCue:
        "Trois piliers : capture, exécution et relation partenaire — présentés séquentiellement.",
    },
    {
      id: "p5",
      type: "capture_buyin",
      title: "Capture",
    },
    {
      id: "p7",
      type: "engine_buyin",
      title: "Engine — 60 jours",
      coachCue:
        "Phase de déploiement sur 60 jours puis activation — fenêtre garantie 90 jours à compter de l'activation.",
    },
    {
      id: "p9",
      type: "partner_buyin",
      title: "Partner",
    },
    {
      id: "pRoi",
      type: "roi_contract",
      title: "Votre ROI",
      coachCue:
        "Bénéfice contractuel : 20 RDV B2B garantis en 3 mois · valeur année 1 : 60 000 €.",
    },
    {
      id: "p11",
      type: "faq_close",
      title: "Questions ?",
    },
    {
      id: "pDashboard",
      type: "dashboard_link",
      title: "Activer",
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
