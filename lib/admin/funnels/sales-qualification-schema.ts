import { z } from "zod";

import {
  getHerculeMonthlyMin,
  getSliderConfigs,
  HERCULE_MONTHLY_MIN,
  SLIDER_CONFIGS,
} from "@/components/internal/funnels/sales/sales-questions";
import {
  COMPTABLE_ANNUAL_MIN,
  COMPTABLE_FACTURATION_MODES,
  COMPTABLE_PONCTUEL_MIN,
  COMPTABLE_SOCIAL_PAIE_MODES,
  type ComptableFacturationMode,
  type ComptableSocialPaieMode,
} from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  CIF_ANNUAL_MIN,
  CIF_FACTURATION_MODES,
  CIF_PONCTUEL_MIN,
  CIF_REMUNERATION_MODES,
  type CifFacturationMode,
  type CifRemunerationMode,
} from "@/components/internal/funnels/sales/sales-questions-cif";
import type { SalesFunnelSectionId } from "@/components/internal/funnels/sales/sales-funnel-sections";
import {
  isCabinetBuyerSalesAudience,
  isCifSalesAudience,
  isComptableSalesAudience,
} from "@/lib/admin/funnels/sales-audience";
import type { O3DurationId } from "@/lib/admin/funnels/sales-bleed-track";
import {
  isValidW13WhySelection,
  isValidW16DetailSelection,
  isWizardUrgencyStepVisible,
  needsW8TriedWho,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import type { Audience } from "@/lib/admin/navigation";

export const SALES_SKIP_VALUE = "__skip__";

const O3_DURATION_IDS = ["<3m", "6m", "12m", "24m+"] as const satisfies readonly O3DurationId[];

const multiChoiceSchema = z.array(z.string()).min(1).max(3);

const conditionalSliderSchema = z.union([
  z.number(),
  z.literal(SALES_SKIP_VALUE),
]);

function buildMatrixSliderSchema(monthlyMin: number) {
  return z.object({
    months3: z.number().min(monthlyMin),
    months6: z.number().min(monthlyMin),
    months12: z.number().min(monthlyMin),
  });
}

const sharedQualificationFields = {
  introConfirmed: z.boolean().refine((value) => value, {
    message: "Veuillez confirmer avant de continuer.",
  }),
  presentationConfirmed: z.boolean().refine((value) => value, {
    message: "Veuillez confirmer avoir pris connaissance de la présentation.",
  }),
  o1: multiChoiceSchema,
  o2: z.string().min(1),
  o3: z.string().min(1),
  o4: multiChoiceSchema,
  o5: multiChoiceSchema,
  o6: z.string().min(1),
  o3FollowUp: z.string().optional(),
  o3Duration: z.enum(O3_DURATION_IDS).optional(),
  bleedDiagnosticAccepted: z.boolean(),
  b1: z.enum(["more_dossiers", "better_quality", "monthly_growth"]).optional(),
  b2: z.number().optional(),
  b3: z.enum(["y2015", "y2017", "y2020", "y2022", "y2024"]).optional(),
  b3Year: z.number().int().optional(),
  b4: z.number().optional(),
  b5: z.array(z.string()).max(2).optional(),
  b5b: z.string().optional(),
  b6Acknowledged: z.boolean().optional(),
  b7: z.string().optional(),
  b8: z.string().optional(),
  w1: z.enum(["more_volume", "better_quality"]).optional(),
  w2: z.number().optional(),
  w3: z.number().optional(),
  w4: z.number().optional(),
  w5: z.number().optional(),
  w6: z.number().optional(),
  w7: z.number().optional(),
  w8: z
    .enum([
      "word_of_mouth",
      "seo",
      "ads",
      "referrers",
      "direct",
      "partnerships",
      "nothing",
    ])
    .optional(),
  w8Tried: z.enum(["none", "looked", "tried"]).optional(),
  w8TriedWho: z.string().optional(),
  w8Criteria: z.array(z.string()).max(3).optional(),
  w8Brake: z.string().optional(),
  w9Acknowledged: z.boolean().optional(),
  w10: z.enum(["y2015", "y2017", "y2020", "y2022", "y2024"]).optional(),
  w10Year: z.number().int().optional(),
  w11: z.enum(["<1y", "1-3y", "3-5y", "5y+"]).optional(),
  w12Confirmed: z.boolean().optional(),
  w13: z.enum(["yes", "no"]).optional(),
  w13Why: z.string().optional(),
  w14: z.enum(["12m", "24m", "36m"]).optional(),
  w15: z.enum(["wait", "shortcut"]).optional(),
  w16: z.enum(["strategic", "resale", "other"]).optional(),
  w16StrategicSub: z.enum(["growth", "recruitment", "associate"]).optional(),
  w16ResaleSub: z.enum(["valuation", "succession", "exit"]).optional(),
  w16Detail: z.string().optional(),
  wExchangeWhy13: z.enum(["certainty", "not_real_goal"]).optional(),
  wExchangeWhy14: z.enum(["certainty", "not_real_goal"]).optional(),
  wExchangeWhy15: z.enum(["certainty", "not_real_goal"]).optional(),
  wExchangeWhy18: z.enum(["certainty", "not_real_goal"]).optional(),
  w18: z
    .enum(["major_gap", "significant_gap", "moderate_gap", "near_target", "at_capacity"])
    .optional(),
  w19: z.number().optional(),
  w17Acknowledged: z.boolean().optional(),
  p2DecisionMakers: z.enum(["all_present", "missing"]).optional(),
  p2MissingRole: z
    .enum(["associate", "managing_partner", "expert_referent", "ops_director", "reschedule"])
    .optional(),
  /** @deprecated Use p2MissingRole */
  p2MissingNames: z.string().optional(),
  p3Acknowledged: z.boolean().optional(),
  pCgvAccepted: z.boolean().optional(),
  p5BuyIn: z.enum(["clear", "questions"]).optional(),
  p7FoundationBuyIn: z.enum(["clear", "questions"]).optional(),
  p7BuyIn: z.enum(["clear", "questions"]).optional(),
  p9BuyIn: z.enum(["clear", "questions"]).optional(),
  pRoiAcknowledged: z.boolean().optional(),
  p11TempCheck: z.enum(["yes", "hesitant"]).optional(),
  p11WhyId: z
    .enum([
      "zone_lock",
      "close_gap",
      "owned_asset",
      "guarantee_roi",
      "replace_method",
      "urgency",
      "criteria_fit",
    ])
    .optional(),
  /** @deprecated Use p11WhyId */
  p11Why: z.string().optional(),
  p12Plan: z.enum(["core", "horizon"]).optional(),
  p12WhyId: z
    .enum([
      "controlled_budget",
      "gradual_deploy",
      "capacity_match",
      "guarantee_20_rdv",
      "max_capture",
      "gap_ambition",
    ])
    .optional(),
  /** @deprecated Use p12WhyId */
  p12Why: z.string().optional(),
  pitchWizardCompleted: z.boolean().optional(),
  sCaptureTied: z.boolean().optional(),
  sEngineTied: z.boolean().optional(),
  sPartnerTied: z.boolean().optional(),
  sTempCheck: z.enum(["yes", "think"]).optional(),
  sThinkBeat1: z.boolean().optional(),
  sThinkBeat2: z.boolean().optional(),
  sThinkBeat3: z.boolean().optional(),
  sOffer: z.enum(["core", "horizon"]).optional(),
  sOfferCopiedAt: z.string().optional(),
  q1: multiChoiceSchema,
  q2: multiChoiceSchema,
  q2Other: z.string().optional(),
  q3: z.number().min(SLIDER_CONFIGS.projectCapacity.min),
  q4: z.string().optional(),
  q5: z.string().optional(),
  q6: z.number().optional(),
  q7: z.number().nullable().optional(),
  q8: z.array(z.string()).optional(),
  q9: z.string().optional(),
  q10: z.string().optional(),
  q11: multiChoiceSchema,
  q12: z.string().min(1),
  q19: multiChoiceSchema,
  q20: z.number().min(SLIDER_CONFIGS.herculeCapacity.min),
  q21: z.array(z.string()).default([]),
};

function buildAgenceQualificationSchema(monthlyMin: number) {
  return z.object({
    ...sharedQualificationFields,
    q13: z.number().min(monthlyMin).nullable(),
    q14: buildMatrixSliderSchema(monthlyMin),
    q15: conditionalSliderSchema,
    q16: conditionalSliderSchema,
    q17: conditionalSliderSchema,
    q18: conditionalSliderSchema,
  });
}

function withCabinetO3FollowUpRefinement<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}

const cabinetOptionalQualificationFields = {
  presentationConfirmed: z.boolean().optional(),
  q1: z.array(z.string()).default([]),
  q2: z.array(z.string()).default([]),
  q3: z.number().optional(),
  q11: z.array(z.string()).default([]),
  q12: z.string().optional(),
  q13: z.number().optional(),
  q19: z.array(z.string()).default([]),
  q20: z.number().optional(),
  q21: z.array(z.string()).default([]),
};

function buildComptableQualificationSchema() {
  return withCabinetO3FollowUpRefinement(
    z.object({
      ...sharedQualificationFields,
      ...cabinetOptionalQualificationFields,
      o1: z.array(z.string()).default([]),
      o2: z.string().optional(),
      o3: z.string().optional(),
      o4: z.array(z.string()).default([]),
      o5: z.array(z.string()).default([]),
      o6: z.string().optional(),
      q14: z.enum(COMPTABLE_FACTURATION_MODES).optional(),
      q15: z.enum(COMPTABLE_SOCIAL_PAIE_MODES).optional(),
      q16: z.number().min(COMPTABLE_PONCTUEL_MIN).nullable().optional(),
      q17: z.literal(SALES_SKIP_VALUE).optional(),
      q18: z.literal(SALES_SKIP_VALUE).optional(),
    }),
  );
}

function buildCifQualificationSchema() {
  return withCabinetO3FollowUpRefinement(
    z.object({
      ...sharedQualificationFields,
      ...cabinetOptionalQualificationFields,
      o1: z.array(z.string()).default([]),
      o2: z.string().optional(),
      o3: z.string().optional(),
      o4: z.array(z.string()).default([]),
      o5: z.array(z.string()).default([]),
      o6: z.string().optional(),
      q14: z.enum(CIF_FACTURATION_MODES).optional(),
      q15: z.enum(CIF_REMUNERATION_MODES).optional(),
      q16: z.number().min(CIF_PONCTUEL_MIN).nullable().optional(),
      q17: z.literal(SALES_SKIP_VALUE).optional(),
      q18: z.literal(SALES_SKIP_VALUE).optional(),
    }),
  );
}

export function getSalesQualificationSchema(audience: Audience = "agence") {
  if (isCifSalesAudience(audience)) {
    return buildCifQualificationSchema();
  }
  if (isComptableSalesAudience(audience)) {
    return buildComptableQualificationSchema();
  }
  return buildAgenceQualificationSchema(getHerculeMonthlyMin(audience));
}

export const salesQualificationSchema = getSalesQualificationSchema("agence");

export type Q14Matrix = {
  months3: number;
  months6: number;
  months12: number;
};

export type SalesQualificationValues = {
  introConfirmed: boolean;
  presentationConfirmed: boolean;
  o1: string[];
  o2: string;
  o3: string;
  o4: string[];
  o5: string[];
  o6: string;
  o3FollowUp?: string;
  o3Duration?: O3DurationId;
  bleedDiagnosticAccepted: boolean;
  b1?: "more_dossiers" | "better_quality" | "monthly_growth";
  b2?: number;
  b3?: "y2015" | "y2017" | "y2020" | "y2022" | "y2024";
  b3Year?: number;
  b4?: number;
  b5?: string[];
  b5b?: string;
  b6Acknowledged?: boolean;
  b7?: string;
  b8?: string;
  w1?: "more_volume" | "better_quality";
  w2?: number;
  w3?: number;
  w4?: number;
  w5?: number;
  w6?: number;
  w7?: number;
  w8?:
    | "word_of_mouth"
    | "seo"
    | "ads"
    | "referrers"
    | "direct"
    | "partnerships"
    | "nothing";
  w8Tried?: "none" | "looked" | "tried";
  w8TriedWho?: string;
  w8Criteria?: string[];
  w8Brake?: string;
  w9Acknowledged?: boolean;
  w10?: "y2015" | "y2017" | "y2020" | "y2022" | "y2024";
  w10Year?: number;
  w11?: "<1y" | "1-3y" | "3-5y" | "5y+";
  w12Confirmed?: boolean;
  w13?: "yes" | "no";
  w13Why?: string;
  w14?: "12m" | "24m" | "36m";
  w15?: "wait" | "shortcut";
  w16?: "strategic" | "resale" | "other";
  w16StrategicSub?: "growth" | "recruitment" | "associate";
  w16ResaleSub?: "valuation" | "succession" | "exit";
  w16Detail?: string;
  wExchangeWhy13?: "certainty" | "not_real_goal";
  wExchangeWhy14?: "certainty" | "not_real_goal";
  wExchangeWhy15?: "certainty" | "not_real_goal";
  wExchangeWhy18?: "certainty" | "not_real_goal";
  w18?: "major_gap" | "significant_gap" | "moderate_gap" | "near_target" | "at_capacity";
  w19?: number;
  w17Acknowledged?: boolean;
  p2DecisionMakers?: "all_present" | "missing";
  p2MissingRole?: "associate" | "managing_partner" | "expert_referent" | "ops_director" | "reschedule";
  /** @deprecated Use p2MissingRole */
  p2MissingNames?: string;
  p3Acknowledged?: boolean;
  pCgvAccepted?: boolean;
  p5BuyIn?: "clear" | "questions";
  p7FoundationBuyIn?: "clear" | "questions";
  p7BuyIn?: "clear" | "questions";
  p9BuyIn?: "clear" | "questions";
  pRoiAcknowledged?: boolean;
  p11TempCheck?: "yes" | "hesitant";
  p11WhyId?:
    | "zone_lock"
    | "close_gap"
    | "owned_asset"
    | "guarantee_roi"
    | "replace_method"
    | "urgency"
    | "criteria_fit";
  /** @deprecated Use p11WhyId */
  p11Why?: string;
  p12Plan?: "core" | "horizon";
  p12WhyId?:
    | "controlled_budget"
    | "gradual_deploy"
    | "capacity_match"
    | "guarantee_20_rdv"
    | "max_capture"
    | "gap_ambition";
  /** @deprecated Use p12WhyId */
  p12Why?: string;
  pitchWizardCompleted?: boolean;
  sCaptureTied?: boolean;
  sEngineTied?: boolean;
  sPartnerTied?: boolean;
  sTempCheck?: "yes" | "think";
  sThinkBeat1?: boolean;
  sThinkBeat2?: boolean;
  sThinkBeat3?: boolean;
  sOffer?: "core" | "horizon";
  sOfferCopiedAt?: string;
  q1: string[];
  q2: string[];
  q2Other?: string;
  q3: number;
  q4?: string;
  q5?: string;
  q6?: number;
  q7?: number | null;
  q8?: string[];
  q9?: string;
  q10?: string;
  q11: string[];
  q12: string;
  q13: number | null;
  q14: Q14Matrix | ComptableFacturationMode | CifFacturationMode;
  q15: ConditionalSliderValue | ComptableSocialPaieMode | CifRemunerationMode;
  q16: ConditionalSliderValue | number | null;
  q17: ConditionalSliderValue;
  q18: ConditionalSliderValue;
  q19: string[];
  q20: number;
  q21: string[];
};

export type ConditionalSliderValue = number | typeof SALES_SKIP_VALUE;

export function getSalesQualificationDefaultValues(
  audience: Audience = "agence",
): SalesQualificationValues {
  const sliders = getSliderConfigs(audience);

  if (isCifSalesAudience(audience)) {
    return {
      introConfirmed: false,
      presentationConfirmed: false,
      o1: [],
      o2: "",
      o3: "",
      o4: [],
      o5: [],
      o6: "",
      o3FollowUp: "",
      o3Duration: undefined,
      bleedDiagnosticAccepted: false,
      b1: undefined,
      b2: undefined,
      b3: undefined,
      b3Year: undefined,
      b4: undefined,
      b5: [],
      b5b: undefined,
      b6Acknowledged: false,
      b7: undefined,
      b8: undefined,
      w1: undefined,
      w2: undefined,
      w3: undefined,
      w4: undefined,
      w5: undefined,
      w6: undefined,
      w7: undefined,
      w19: undefined,
      w8: undefined,
      w8Tried: undefined,
      w8TriedWho: "",
      w8Criteria: [],
      w8Brake: undefined,
      w9Acknowledged: false,
      w10: undefined,
      w10Year: undefined,
      w11: undefined,
      w12Confirmed: false,
      w13: undefined,
      w13Why: "",
      w14: undefined,
      w15: undefined,
      w16: undefined,
      w16StrategicSub: undefined,
      w16ResaleSub: undefined,
      w16Detail: "",
      wExchangeWhy13: undefined,
      wExchangeWhy14: undefined,
      wExchangeWhy15: undefined,
      wExchangeWhy18: undefined,
      w18: undefined,
      w17Acknowledged: false,
      p2DecisionMakers: undefined,
      p2MissingRole: undefined,
      p2MissingNames: "",
      p3Acknowledged: false,
      pCgvAccepted: false,
      p5BuyIn: undefined,
      p7FoundationBuyIn: undefined,
      p7BuyIn: undefined,
      p9BuyIn: undefined,
      pRoiAcknowledged: false,
      p11TempCheck: undefined,
      p11WhyId: undefined,
      p11Why: "",
      p12Plan: undefined,
      p12WhyId: undefined,
      p12Why: "",
      pitchWizardCompleted: false,
      sCaptureTied: false,
      sEngineTied: false,
      sPartnerTied: false,
      sTempCheck: undefined,
      sThinkBeat1: false,
      sThinkBeat2: false,
      sThinkBeat3: false,
      sOffer: undefined,
      sOfferCopiedAt: undefined,
      q1: [],
      q2: [],
      q2Other: "",
      q3: sliders.projectCapacity.defaultValue,
      q4: "",
      q5: "",
      q6: sliders.delayCount.defaultValue,
      q7: sliders.lostClients.defaultValue,
      q8: [],
      q9: "",
      q10: "",
      q11: [],
      q12: "",
      q13: sliders.annualMin.defaultValue,
      q14: "monthly_12",
      q15: "mixte",
      q16: null,
      q17: SALES_SKIP_VALUE,
      q18: SALES_SKIP_VALUE,
      q19: [],
      q20: sliders.herculeCapacity.defaultValue,
      q21: [],
    };
  }

  if (isComptableSalesAudience(audience)) {
    return {
      introConfirmed: false,
      presentationConfirmed: false,
      o1: [],
      o2: "",
      o3: "",
      o4: [],
      o5: [],
      o6: "",
      o3FollowUp: "",
      o3Duration: undefined,
      bleedDiagnosticAccepted: false,
      b1: undefined,
      b2: undefined,
      b3: undefined,
      b3Year: undefined,
      b4: undefined,
      b5: [],
      b5b: undefined,
      b6Acknowledged: false,
      b7: undefined,
      b8: undefined,
      w1: undefined,
      w2: undefined,
      w3: undefined,
      w4: undefined,
      w5: undefined,
      w6: undefined,
      w7: undefined,
      w19: undefined,
      w8: undefined,
      w8Tried: undefined,
      w8TriedWho: "",
      w8Criteria: [],
      w8Brake: undefined,
      w9Acknowledged: false,
      w10: undefined,
      w10Year: undefined,
      w11: undefined,
      w12Confirmed: false,
      w13: undefined,
      w13Why: "",
      w14: undefined,
      w15: undefined,
      w16: undefined,
      w16StrategicSub: undefined,
      w16ResaleSub: undefined,
      w16Detail: "",
      wExchangeWhy13: undefined,
      wExchangeWhy14: undefined,
      wExchangeWhy15: undefined,
      wExchangeWhy18: undefined,
      w18: undefined,
      w17Acknowledged: false,
      p2DecisionMakers: undefined,
      p2MissingRole: undefined,
      p2MissingNames: "",
      p3Acknowledged: false,
      pCgvAccepted: false,
      p5BuyIn: undefined,
      p7FoundationBuyIn: undefined,
      p7BuyIn: undefined,
      p9BuyIn: undefined,
      pRoiAcknowledged: false,
      p11TempCheck: undefined,
      p11WhyId: undefined,
      p11Why: "",
      p12Plan: undefined,
      p12WhyId: undefined,
      p12Why: "",
      pitchWizardCompleted: false,
      sCaptureTied: false,
      sEngineTied: false,
      sPartnerTied: false,
      sTempCheck: undefined,
      sThinkBeat1: false,
      sThinkBeat2: false,
      sThinkBeat3: false,
      sOffer: undefined,
      sOfferCopiedAt: undefined,
      q1: [],
      q2: [],
      q2Other: "",
      q3: sliders.projectCapacity.defaultValue,
      q4: "",
      q5: "",
      q6: sliders.delayCount.defaultValue,
      q7: sliders.lostClients.defaultValue,
      q8: [],
      q9: "",
      q10: "",
      q11: [],
      q12: "",
      q13: sliders.annualMin.defaultValue,
      q14: "monthly_12",
      q15: "included",
      q16: null,
      q17: SALES_SKIP_VALUE,
      q18: SALES_SKIP_VALUE,
      q19: [],
      q20: sliders.herculeCapacity.defaultValue,
      q21: [],
    };
  }

  return {
    introConfirmed: false,
    presentationConfirmed: false,
    o1: [],
    o2: "",
    o3: "",
    o4: [],
    o5: [],
    o6: "",
    o3FollowUp: "",
    o3Duration: undefined,
    bleedDiagnosticAccepted: false,
    q1: [],
    q2: [],
    q2Other: "",
    q3: sliders.projectCapacity.defaultValue,
    q4: "",
    q5: "",
    q6: sliders.delayCount.defaultValue,
    q7: sliders.lostClients.defaultValue,
    q8: [],
    q9: "",
    q10: "",
    q11: [],
    q12: "",
    q13: sliders.oneTimeMin.defaultValue,
    q14: {
      months3: sliders.monthlyMin.defaultValue,
      months6: sliders.monthlyMin.defaultValue,
      months12: sliders.monthlyMin.defaultValue,
    },
    q15: sliders.monthlyMin.defaultValue,
    q16: sliders.paidAdsDuration.defaultValue,
    q17: sliders.monthlyMin.defaultValue,
    q18: sliders.seoDuration.defaultValue,
    q19: [],
    q20: sliders.herculeCapacity.defaultValue,
    q21: [],
  };
}

export const salesQualificationDefaultValues =
  getSalesQualificationDefaultValues("agence");

const SECTION_QUESTION_KEYS: Record<
  Exclude<SalesFunnelSectionId, "rendez-vous">,
  Array<keyof SalesQualificationValues>
> = {
  introduction: ["introConfirmed"],
  objectifs: [
    "o1",
    "o2",
    "o3",
    "o4",
    "o5",
    "o6",
    "o3FollowUp",
    "bleedDiagnosticAccepted",
  ],
  pitch: ["pitchWizardCompleted"],
  sliders: [],
  mapping: [],
  "presentation-societe": ["presentationConfirmed"],
  capacite: ["q1", "q2", "q3"],
  standards: ["q11", "q12", "q13", "q14"],
  conditions: ["q15", "q16", "q17", "q18", "q19", "q20"],
};

const CABINET_OBJECTIFS_KEYS: Array<keyof SalesQualificationValues> = [
  "w1",
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w19",
  "w8",
  "w8Tried",
  "w8Brake",
  "w9Acknowledged",
  "w8Criteria",
  "w10",
  "w11",
  "w12Confirmed",
  "w13",
  "w14",
  "w15",
  "w18",
  "w17Acknowledged",
  "bleedDiagnosticAccepted",
];

const CABINET_PITCH_KEYS: Array<keyof SalesQualificationValues> = [
  "p2DecisionMakers",
  "p2MissingRole",
  "p3Acknowledged",
  "pCgvAccepted",
  "p5BuyIn",
  "p7FoundationBuyIn",
  "p7BuyIn",
  "p9BuyIn",
  "pRoiAcknowledged",
  "p11TempCheck",
  "p11WhyId",
  "p12Plan",
  "p12WhyId",
  "pitchWizardCompleted",
];

const CABINET_SLIDERS_KEYS: Array<keyof SalesQualificationValues> = [
  "sCaptureTied",
  "sEngineTied",
  "sPartnerTied",
  "sTempCheck",
  "sThinkBeat1",
  "sThinkBeat2",
  "sThinkBeat3",
  "sOffer",
  "sOfferCopiedAt",
];

export function getSectionQuestionKeys(
  sectionId: Exclude<SalesFunnelSectionId, "rendez-vous">,
  audience: Audience = "agence",
): Array<keyof SalesQualificationValues> {
  if (sectionId === "objectifs" && isCabinetBuyerSalesAudience(audience)) {
    return CABINET_OBJECTIFS_KEYS;
  }
  if (sectionId === "pitch" && isCabinetBuyerSalesAudience(audience)) {
    return CABINET_PITCH_KEYS;
  }
  if (sectionId === "sliders" && isCabinetBuyerSalesAudience(audience)) {
    return CABINET_SLIDERS_KEYS;
  }
  return SECTION_QUESTION_KEYS[sectionId];
}

function isCabinetFacturationMode(
  value: SalesQualificationValues["q14"],
): value is ComptableFacturationMode | CifFacturationMode {
  return typeof value === "string";
}

function isQ14Matrix(value: SalesQualificationValues["q14"]): value is Q14Matrix {
  return typeof value === "object" && value !== null && "months3" in value;
}

function isConditionalSliderComplete(value: ConditionalSliderValue): boolean {
  return value === SALES_SKIP_VALUE || typeof value === "number";
}

function isFieldComplete(
  key: keyof SalesQualificationValues,
  values: SalesQualificationValues,
  audience: Audience,
): boolean {
  const value = values[key];
  const monthlyMin = getHerculeMonthlyMin(audience);

  if (key === "pitchWizardCompleted") {
    return value === true;
  }

  if (
    key === "p2MissingRole" ||
    key === "p2MissingNames" ||
    key === "p3Acknowledged" ||
    key === "pCgvAccepted" ||
    key === "p5BuyIn" ||
    key === "p7FoundationBuyIn" ||
    key === "p7BuyIn" ||
    key === "p9BuyIn" ||
    key === "pRoiAcknowledged" ||
    key === "p11TempCheck" ||
    key === "p11WhyId" ||
    key === "p11Why" ||
    key === "p12Plan" ||
    key === "p12WhyId" ||
    key === "p12Why" ||
    key === "p2DecisionMakers" ||
    key === "sCaptureTied" ||
    key === "sEngineTied" ||
    key === "sPartnerTied" ||
    key === "sTempCheck" ||
    key === "sThinkBeat1" ||
    key === "sThinkBeat2" ||
    key === "sThinkBeat3" ||
    key === "sOffer" ||
    key === "sOfferCopiedAt"
  ) {
    return true;
  }

  if (key === "introConfirmed" || key === "presentationConfirmed") {
    return value === true;
  }

  if (key === "bleedDiagnosticAccepted") {
    return value === true;
  }

  if (key === "o3Duration") {
    return true;
  }

  if (key === "b5b") {
    const b5Count = values.b5?.length ?? 0;
    if (b5Count <= 1) {
      return true;
    }
    return typeof value === "string" && value.length > 0;
  }

  if (key === "b6Acknowledged") {
    return true;
  }

  if (key === "w12Confirmed" || key === "w17Acknowledged") {
    return value === true;
  }

  if (
    key === "w10Year" ||
    key === "w13Why" ||
    key === "w16Detail" ||
    key === "w8TriedWho" ||
    key === "wExchangeWhy13" ||
    key === "wExchangeWhy14" ||
    key === "wExchangeWhy15" ||
    key === "wExchangeWhy18" ||
    key === "w16StrategicSub" ||
    key === "w16ResaleSub"
  ) {
    return true;
  }

  if (key === "w8Criteria") {
    const criteria = values.w8Criteria ?? [];
    return criteria.length >= 1 && criteria.length <= 3;
  }

  if (key === "w9Acknowledged") {
    return value === true;
  }

  if (key === "w16") {
    if (!isWizardUrgencyStepVisible(values)) {
      return true;
    }
    return typeof value === "string" && value.length > 0;
  }

  if (key === "q2Other" || key === "o3FollowUp") {
    if (key === "o3FollowUp") {
      if (
        isCabinetBuyerSalesAudience(audience) &&
        values.o3 === "insufficient_prospects"
      ) {
        return Boolean(values.o3FollowUp?.trim());
      }
      return true;
    }
    return true;
  }

  if (key === "q13") {
    if (isCifSalesAudience(audience)) {
      return typeof value === "number" && value >= CIF_ANNUAL_MIN;
    }
    if (isComptableSalesAudience(audience)) {
      return typeof value === "number" && value >= COMPTABLE_ANNUAL_MIN;
    }
    return value === null || typeof value === "number";
  }

  if (key === "q14") {
    if (isCabinetBuyerSalesAudience(audience)) {
      return isCabinetFacturationMode(values.q14);
    }
    const matrix = values.q14;
    if (!isQ14Matrix(matrix)) {
      return false;
    }
    return (
      matrix.months3 >= monthlyMin &&
      matrix.months6 >= monthlyMin &&
      matrix.months12 >= monthlyMin
    );
  }

  if (key === "q15") {
    if (isCabinetBuyerSalesAudience(audience)) {
      return typeof value === "string" && value.length > 0;
    }
    return isConditionalSliderComplete(value as ConditionalSliderValue);
  }

  if (key === "q16") {
    if (isCabinetBuyerSalesAudience(audience)) {
      return value === null || typeof value === "number";
    }
    return isConditionalSliderComplete(value as ConditionalSliderValue);
  }

  if (key === "q17" || key === "q18") {
    if (isCabinetBuyerSalesAudience(audience)) {
      return value === SALES_SKIP_VALUE;
    }
    return isConditionalSliderComplete(value as ConditionalSliderValue);
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  return false;
}

export function isSalesSectionComplete(
  sectionId: SalesFunnelSectionId,
  values: SalesQualificationValues,
  audience: Audience = "agence",
): boolean {
  if (sectionId === "rendez-vous" || sectionId === "mapping") {
    return false;
  }

  const keys = getSectionQuestionKeys(sectionId, audience);
  const baseComplete = keys.every((key) => isFieldComplete(key, values, audience));

  if (!baseComplete) {
    return false;
  }

  if (sectionId === "objectifs" && isCabinetBuyerSalesAudience(audience)) {
    if (values.w13 === "no" && !isValidW13WhySelection(values)) {
      return false;
    }
    if (values.w13 === "yes" && !values.wExchangeWhy13) {
      return false;
    }
    if (
      values.w13 === "yes" &&
      values.w14 !== undefined &&
      values.w14 !== "12m" &&
      !values.wExchangeWhy14
    ) {
      return false;
    }
    if (
      ((values.w15 === "wait" && values.w14 === "12m") ||
        (values.w13 === "yes" && values.w15 === "shortcut")) &&
      !values.wExchangeWhy15
    ) {
      return false;
    }
    if (isWizardUrgencyStepVisible(values) && !values.w16) {
      return false;
    }
    if (values.w16 === "strategic" && !values.w16StrategicSub) {
      return false;
    }
    if (values.w16 === "resale" && !values.w16ResaleSub) {
      return false;
    }
    if (values.w16 === "other" && !isValidW16DetailSelection(values)) {
      return false;
    }
    if (
      (values.w18 === "near_target" || values.w18 === "at_capacity") &&
      !values.wExchangeWhy18
    ) {
      return false;
    }
    if (needsW8TriedWho(values) && !values.w8TriedWho?.trim()) {
      return false;
    }
    if (values.w9Acknowledged !== true) {
      return false;
    }
    if ((values.w8Criteria?.length ?? 0) < 1) {
      return false;
    }
    if (!values.w11) {
      return false;
    }
    if (values.w17Acknowledged !== true) {
      return false;
    }
    if (!values.w18) {
      return false;
    }
  }

  if (sectionId === "objectifs" && !isCabinetBuyerSalesAudience(audience)) {
    if (values.o3 === "insufficient_prospects" && !values.o3FollowUp?.trim()) {
      return false;
    }
  }

  if (sectionId === "capacite" && values.q2.includes("other")) {
    return Boolean(values.q2Other?.trim());
  }

  if (sectionId === "standards" && isCabinetBuyerSalesAudience(audience)) {
    return values.q21.length > 0 && values.q21.length <= 3;
  }

  if (sectionId === "sliders" && isCabinetBuyerSalesAudience(audience)) {
    return (
      values.sTempCheck === "yes" &&
      (values.sOffer === "core" || values.sOffer === "horizon") &&
      Boolean(values.sOfferCopiedAt)
    );
  }

  if (sectionId === "pitch" && isCabinetBuyerSalesAudience(audience)) {
    if (values.bleedDiagnosticAccepted !== true) {
      return false;
    }
    if (!values.p2DecisionMakers) {
      return false;
    }
    if (
      values.p2DecisionMakers === "missing" &&
      !values.p2MissingRole
    ) {
      return false;
    }
    if (values.p3Acknowledged !== true) {
      return false;
    }
    if (values.pCgvAccepted !== true) {
      return false;
    }
    if (values.p5BuyIn !== "clear" || values.p7FoundationBuyIn !== "clear" || values.p7BuyIn !== "clear" || values.p9BuyIn !== "clear") {
      return false;
    }
    if (values.pRoiAcknowledged !== true) {
      return false;
    }
    if (!values.p11TempCheck) {
      return false;
    }
    if (values.p11TempCheck === "yes" && !values.p11WhyId) {
      return false;
    }
    return values.pitchWizardCompleted === true;
  }

  return true;
}

function getQualificationSectionIds(
  audience: Audience = "agence",
): Array<Exclude<SalesFunnelSectionId, "rendez-vous">> {
  if (isCabinetBuyerSalesAudience(audience)) {
    return ["introduction", "objectifs", "pitch"];
  }
  return [
    "introduction",
    "objectifs",
    "presentation-societe",
    "capacite",
    "standards",
    "conditions",
  ];
}

export function getSalesQualificationProgress(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): {
  completedSections: number;
  totalSections: number;
  percent: number;
} {
  const sectionIds = getQualificationSectionIds(audience);
  const completedSections = sectionIds.filter((sectionId) =>
    isSalesSectionComplete(sectionId, values, audience),
  ).length;

  const totalSections = sectionIds.length;
  const percent = Math.round((completedSections / totalSections) * 100);

  return { completedSections, totalSections, percent };
}

export function isSalesQualificationComplete(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): boolean {
  const { completedSections, totalSections } = getSalesQualificationProgress(
    values,
    audience,
  );
  return completedSections === totalSections;
}

export function mergeSalesQualificationValues(
  partial?: Partial<SalesQualificationValues>,
  audience: Audience = "agence",
): SalesQualificationValues {
  const defaults = getSalesQualificationDefaultValues(audience);
  const merged = {
    ...defaults,
    ...partial,
  };

  if (isCabinetBuyerSalesAudience(audience)) {
    return merged;
  }

  const matrixDefault = defaults.q14;
  const matrixPartial = partial?.q14;
  if (isQ14Matrix(matrixDefault) && isQ14Matrix(matrixPartial)) {
    return {
      ...merged,
      q14: {
        ...matrixDefault,
        ...matrixPartial,
      },
    };
  }

  return merged;
}

/** @deprecated Use getHerculeMonthlyMin(audience) instead. */
export { HERCULE_MONTHLY_MIN };
