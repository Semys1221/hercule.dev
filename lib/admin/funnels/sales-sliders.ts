import { formatSliderLabel } from "@/components/internal/funnels/sales/sales-questions";
import {
  formatPitchWizardInterpolation,
  type PitchInterpolationContext,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

export const SLIDERS_SECTION_SUBTITLE =
  "Présentation share-screen — props ouvertes, tie-downs et lien de paiement dans le rail closer.";

export const SLIDERS_STEP_IDS = [
  "s1_recap",
  "s2_goal",
  "s3_deciders",
  "s4_diff",
  "s5_pillars",
  "s6_capture",
  "s7_engine",
  "s8_partner",
  "s9_temp",
  "s10_offer",
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
    caption: "20 RDV B2B — le risque est sur notre bilan",
  },
] as const;

export type SlidersOfferId = "core" | "horizon";

export const SLIDERS_OFFER_CORE_BULLETS = [
  "Déploiement standard",
  "Sans exclusivité zone",
  "Sans garantie 20 RDV",
] as const;

export const SLIDERS_OFFER_HORIZON_BULLETS = [
  "Exclusivité totale zone",
  "Capture maximale",
  "20 RDV B2B garantis",
] as const;

export const SLIDERS_HUD_BY_STEP: Record<SlidersStepId, readonly string[]> = {
  s1_recap: [
    "Situation : {method}",
    "Frein : {cause}",
    "Enjeu : {inaction}",
  ],
  s2_goal: ["Objectif 6 mois : {goal6m}", "Écart : {gap}"],
  s3_deciders: ["Y a-t-il quelqu'un d'autre qui devrait voir ça ?"],
  s4_diff: [
    "La plupart testent {method} — nous branchons les flux légaux",
    "Traiter {cause}, pas empiler une campagne",
  ],
  s5_pillars: ["Objectif : {goal6m} — 3 piliers détection / activation / pilotage"],
  s6_capture: [
    "Levier actuel : {method}",
    "Capture intercepte l'intention légale",
    "Tie-down : « Pourquoi c'est important pour vous ? »",
  ],
  s7_engine: [
    "J+60 système live — garantie 90 j",
    "Sans activation : {inaction}",
    "Tie-down : « Pourquoi c'est important pour vous ? »",
  ],
  s8_partner: [
    "Inbound < 24 h côté cabinet",
    "Future-pace : {goal6m} à 12 mois",
    "Tie-down : « Pourquoi c'est important pour vous ? »",
  ],
  s9_temp: [
    "Temp check — puis « pourquoi ? » à l'oral",
    "Si réflexion : 3 beats puis retour temp check",
  ],
  s10_offer: [
    "A/B close — silence après le prix",
    "« Pourquoi cette option ? » puis copier le lien",
  ],
};

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
    { id: "s8_partner", type: "partner", canvasTitle: "Pilotage" },
    {
      id: "s9_temp",
      type: "temp",
      canvasTitle: SLIDERS_TEMP_QUESTIONS[0],
      canvasSubtitle: SLIDERS_TEMP_QUESTIONS[1],
    },
    { id: "s10_offer", type: "offer", canvasTitle: "Choisissez votre infrastructure" },
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
    case "s6_capture":
      return values.sCaptureTied === true;
    case "s7_engine":
      return values.sEngineTied === true;
    case "s8_partner":
      return values.sPartnerTied === true;
    case "s9_temp":
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
    values.sCaptureTied === true &&
    values.sEngineTied === true &&
    values.sPartnerTied === true &&
    values.sTempCheck === "yes" &&
    (values.sOffer === "core" || values.sOffer === "horizon") &&
    Boolean(values.sOfferCopiedAt)
  );
}

export function formatSlidersHudLine(
  template: string,
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): string {
  return formatPitchWizardInterpolation(template, values, audience, context);
}

export function getSlidersHudLines(
  stepId: SlidersStepId,
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): string[] {
  return SLIDERS_HUD_BY_STEP[stepId].map((line) =>
    formatSlidersHudLine(line, values, audience, context),
  );
}
