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
import type { Audience } from "@/lib/admin/navigation";

export const SALES_SKIP_VALUE = "__skip__";

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
  q1: multiChoiceSchema,
  q2: multiChoiceSchema,
  q2Other: z.string().optional(),
  q3: z.number().min(SLIDER_CONFIGS.projectCapacity.min),
  q4: z.string().min(1),
  q5: z.string().min(1),
  q6: z.number().min(SLIDER_CONFIGS.delayCount.min),
  q7: z.number().min(SLIDER_CONFIGS.lostClients.min).nullable(),
  q8: multiChoiceSchema,
  q9: z.string().min(1),
  q10: z.string().min(1),
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

function buildComptableQualificationSchema() {
  return z.object({
    ...sharedQualificationFields,
    q13: z.number().min(COMPTABLE_ANNUAL_MIN),
    q14: z.enum(COMPTABLE_FACTURATION_MODES),
    q15: z.enum(COMPTABLE_SOCIAL_PAIE_MODES),
    q16: z.number().min(COMPTABLE_PONCTUEL_MIN).nullable(),
    q17: z.literal(SALES_SKIP_VALUE),
    q18: z.literal(SALES_SKIP_VALUE),
    q21: multiChoiceSchema,
  });
}

function buildCifQualificationSchema() {
  return z.object({
    ...sharedQualificationFields,
    q13: z.number().min(CIF_ANNUAL_MIN),
    q14: z.enum(CIF_FACTURATION_MODES),
    q15: z.enum(CIF_REMUNERATION_MODES),
    q16: z.number().min(CIF_PONCTUEL_MIN).nullable(),
    q17: z.literal(SALES_SKIP_VALUE),
    q18: z.literal(SALES_SKIP_VALUE),
    q21: multiChoiceSchema,
  });
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
  q1: string[];
  q2: string[];
  q2Other?: string;
  q3: number;
  q4: string;
  q5: string;
  q6: number;
  q7: number | null;
  q8: string[];
  q9: string;
  q10: string;
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
  objectifs: ["o1", "o2", "o3", "o4", "o5", "o6"],
  "presentation-societe": ["presentationConfirmed"],
  capacite: ["q1", "q2", "q3", "q4", "q5"],
  historique: ["q6", "q7", "q8", "q9", "q10"],
  standards: ["q11", "q12", "q13", "q14"],
  conditions: ["q15", "q16", "q17", "q18", "q19", "q20"],
};

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

  if (key === "introConfirmed" || key === "presentationConfirmed") {
    return value === true;
  }

  if (key === "q2Other") {
    return true;
  }

  if (key === "q7") {
    return value === null || typeof value === "number";
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
  if (sectionId === "rendez-vous") {
    return false;
  }

  const keys = SECTION_QUESTION_KEYS[sectionId];
  const baseComplete = keys.every((key) => isFieldComplete(key, values, audience));

  if (!baseComplete) {
    return false;
  }

  if (sectionId === "capacite" && values.q2.includes("other")) {
    return Boolean(values.q2Other?.trim());
  }

  if (sectionId === "standards" && isCabinetBuyerSalesAudience(audience)) {
    return values.q21.length > 0 && values.q21.length <= 3;
  }

  return true;
}

const QUALIFICATION_SECTION_IDS: Array<
  Exclude<SalesFunnelSectionId, "rendez-vous">
> = [
  "introduction",
  "objectifs",
  "presentation-societe",
  "capacite",
  "historique",
  "standards",
  "conditions",
];

export function getSalesQualificationProgress(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): {
  completedSections: number;
  totalSections: number;
  percent: number;
} {
  const completedSections = QUALIFICATION_SECTION_IDS.filter((sectionId) =>
    isSalesSectionComplete(sectionId, values, audience),
  ).length;

  const totalSections = QUALIFICATION_SECTION_IDS.length;
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
