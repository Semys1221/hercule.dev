import { formatSliderLabel } from "@/components/legacy/internal/funnels/sales/sales-questions";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/legacy/admin/navigation";
import { COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_URL } from "@/lib/legacy/payments/comptable-acquisition-offers";

export const SLIDERS_SECTION_SUBTITLE =
  "Présentation share-screen — props ouvertes plein écran.";

export const SLIDERS_STEP_IDS = [
  "s1_recap",
  "s2_goal",
  "s3_deciders",
  "s4_diff",
  "s5_pillars",
  "s6_capture",
  "s7_engine",
  "s8_instantly",
  "s9_partner",
  "s10_temp",
  "s11_offer",
] as const;

export type SlidersStepId = (typeof SLIDERS_STEP_IDS)[number];

export type SlidersSlideType =
  | "recap"
  | "goal"
  | "deciders"
  | "diff"
  | "pillars"
  | "capture"
  | "engine"
  | "instantly"
  | "partner"
  | "temp"
  | "offer";

export type SlidersSlideDefinition = {
  id: SlidersStepId;
  type: SlidersSlideType;
  canvasTitle: string;
  canvasSubtitle?: string;
};

export const SLIDERS_RECAP_TILES = [
  {
    id: "situation",
    label: "Situation",
    caption: "Ce que vous faites aujourd'hui",
  },
  {
    id: "frein",
    label: "Frein",
    caption: "Le frein que vous avez nommé",
  },
  {
    id: "enjeu",
    label: "Enjeu",
    caption: "Ce que ça coûte de ne rien changer",
  },
] as const;

export const SLIDERS_GOAL_CAPTION = "L'objectif que vous avez mentionné";

export const SLIDERS_DECIDERS_LINE = "Tout le monde est là ?";

export const SLIDERS_DIFF = {
  left: { label: "Location", detail: "Attention louée" },
  right: { label: "Actif", detail: "Zone verrouillée" },
} as const;

export const SLIDERS_PILLARS = [
  { id: "capture", name: "Détection", tagline: "Leads légaux à forte intention" },
  { id: "engine", name: "Activation", tagline: "Système live en 60 jours" },
  { id: "partner", name: "Pilotage", tagline: "Accompagnement & croissance 12 mois" },
] as const;

export const SLIDERS_TEMP_QUESTIONS = [
  "Questions ?",
  "C'est la bonne solution pour cet objectif ?",
] as const;

export const SLIDERS_THINK_BEATS = [
  {
    id: "inaction",
    title: "Coût de l'inaction",
    caption: "L'écart que vous avez chiffré",
  },
  {
    id: "scarcity",
    title: "Rareté",
    caption: "Un cabinet par zone — la file n'attend pas",
  },
  {
    id: "guarantee",
    title: "Garantie",
    caption: "10 RDV B2B — le risque est sur notre bilan",
  },
] as const;

export type SlidersOfferId = "core" | "horizon";

export const SLIDERS_OFFER_CORE_BULLETS = [
  "Déploiement standard",
  "Sans exclusivité zone",
  "10 RDV sur 90 j",
] as const;

export const SLIDERS_OFFER_HORIZON_BULLETS = [
  "Exclusivité totale zone",
  "Capture maximale",
  "10 RDV garantis sur 90 j",
] as const;

/** Liens Stripe Payment Link — référence closer (non attribués client). */
export const SLIDERS_STRIPE_PAYMENT_LINKS = [
  {
    id: "lite",
    name: "Hercule Lite",
    offerType: "starter_999_5",
    amountLabel: "1 700 €/mois",
    mode: "Abonnement",
    url: "https://buy.stripe.com/eVqfZg74x1mR4Ddacg3Je0i",
  },
  {
    id: "starter",
    name: "Hercule Starter",
    offerType: "monthly_1499",
    amountLabel: "2 000 €/mois",
    mode: "Abonnement",
    url: "https://buy.stripe.com/7sYeVcbkN3uZ6Ll2JO3Je0j",
  },
  {
    id: "pack3",
    name: "Pack 3 mois Starter",
    offerType: "pack_3x1499",
    amountLabel: "5 277,60 €",
    mode: "One-shot",
    url: "https://buy.stripe.com/28E5kCagJghL3z9acg3Je0k",
  },
  {
    id: "acquisition1489",
    name: "Acquisition 1 mois",
    offerType: "comptable_acquisition_1489_1m",
    amountLabel: "1 489 €/mois",
    mode: "Abonnement",
    url:
      process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489?.trim() ??
      COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_URL,
  },
] as const;

const SLIDERS_CANVAS_COPY: string[] = [
  SLIDERS_GOAL_CAPTION,
  SLIDERS_DECIDERS_LINE,
  ...SLIDERS_RECAP_TILES.map((tile) => tile.caption),
  ...SLIDERS_RECAP_TILES.map((tile) => tile.label),
  SLIDERS_DIFF.left.label,
  SLIDERS_DIFF.left.detail,
  SLIDERS_DIFF.right.label,
  SLIDERS_DIFF.right.detail,
  ...SLIDERS_PILLARS.flatMap((pillar) => [pillar.name, pillar.tagline]),
  "Moteur Hercule Instantly",
  "Démo live",
  ...SLIDERS_TEMP_QUESTIONS,
  ...SLIDERS_THINK_BEATS.flatMap((beat) => [beat.title, beat.caption]),
  ...SLIDERS_OFFER_CORE_BULLETS,
  ...SLIDERS_OFFER_HORIZON_BULLETS,
  SLIDERS_SECTION_SUBTITLE,
];

const FORBIDDEN_CANVAS_TOKEN_PATTERN =
  /\{(method|cause|gap|goal6m|brake|inaction|currentSnapshot|honoraires|department)\}/;

export function assertSlidersCanvasCopyHasNoTokens(): void {
  for (const line of SLIDERS_CANVAS_COPY) {
    if (FORBIDDEN_CANVAS_TOKEN_PATTERN.test(line)) {
      throw new Error(`Sliders canvas copy must not contain tokens: ${line}`);
    }
  }
}

export function getSlidersSlides(): SlidersSlideDefinition[] {
  return [
    { id: "s1_recap", type: "recap", canvasTitle: "Recap" },
    { id: "s2_goal", type: "goal", canvasTitle: SLIDERS_GOAL_CAPTION },
    { id: "s3_deciders", type: "deciders", canvasTitle: SLIDERS_DECIDERS_LINE },
    {
      id: "s4_diff",
      type: "diff",
      canvasTitle: "Ce qui nous distingue",
    },
    {
      id: "s5_pillars",
      type: "pillars",
      canvasTitle: "Le système",
      canvasSubtitle: "Trois piliers",
    },
    { id: "s6_capture", type: "capture", canvasTitle: "Détection" },
    { id: "s7_engine", type: "engine", canvasTitle: "Activation" },
    {
      id: "s8_instantly",
      type: "instantly",
      canvasTitle: "Moteur Hercule Instantly",
      canvasSubtitle: "Démo live",
    },
    { id: "s9_partner", type: "partner", canvasTitle: "Pilotage" },
    {
      id: "s10_temp",
      type: "temp",
      canvasTitle: SLIDERS_TEMP_QUESTIONS[0],
      canvasSubtitle: SLIDERS_TEMP_QUESTIONS[1],
    },
    { id: "s11_offer", type: "offer", canvasTitle: "Choisissez votre infrastructure" },
  ];
}

export function getSlidersSlide(stepId: SlidersStepId): SlidersSlideDefinition | undefined {
  return getSlidersSlides().find((slide) => slide.id === stepId);
}

export function resolveSlidersGoalHero(
  values: SalesQualificationValues,
  audience: Audience,
): { value: string | null; caption: string } {
  if (typeof values.w5 === "number") {
    return {
      value: formatSliderLabel(values.w5, "eur"),
      caption: SLIDERS_GOAL_CAPTION,
    };
  }
  return { value: null, caption: SLIDERS_GOAL_CAPTION };
}

export function areSlidersThinkBeatsComplete(values: SalesQualificationValues): boolean {
  return (
    values.sThinkBeat1 === true &&
    values.sThinkBeat2 === true &&
    values.sThinkBeat3 === true
  );
}

export function canAdvanceFromSlidersStep(
  stepId: SlidersStepId,
  values: SalesQualificationValues,
): boolean {
  switch (stepId) {
    case "s10_temp":
      if (values.sTempCheck === "think") {
        return false;
      }
      return values.sTempCheck === "yes";
    default:
      return true;
  }
}

export function isSlidersSectionComplete(values: SalesQualificationValues): boolean {
  return (
    values.sTempCheck === "yes" &&
    (values.sOffer === "core" || values.sOffer === "horizon") &&
    Boolean(values.sOfferCopiedAt)
  );
}

