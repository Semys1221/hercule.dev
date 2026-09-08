import { z } from "zod";

import {
  getHerculeMonthlyMin,
  getSliderConfigs,
  HERCULE_MONTHLY_MIN,
  SLIDER_CONFIGS,
} from "@/components/internal/funnels/sales/sales-questions";
import type { SalesFunnelSectionId } from "@/components/internal/funnels/sales/sales-funnel-sections";
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

function buildSalesQualificationSchema(monthlyMin: number) {
  return z.object({
    introConfirmed: z.boolean().refine((value) => value, {
      message: "Veuillez confirmer avant de continuer.",
    }),
    presentationConfirmed: z.boolean().refine((value) => value, {
      message: "Veuillez confirmer avoir pris connaissance de la présentation.",
    }),
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
    q13: z.number().min(monthlyMin).nullable(),
    q14: buildMatrixSliderSchema(monthlyMin),
    q15: conditionalSliderSchema,
    q16: conditionalSliderSchema,
    q17: conditionalSliderSchema,
    q18: conditionalSliderSchema,
    q19: multiChoiceSchema,
    q20: z.number().min(SLIDER_CONFIGS.herculeCapacity.min),
  });
}

export function getSalesQualificationSchema(audience: Audience = "agence") {
  return buildSalesQualificationSchema(getHerculeMonthlyMin(audience));
}

export const salesQualificationSchema = getSalesQualificationSchema("agence");

export type SalesQualificationValues = z.infer<typeof salesQualificationSchema>;

export type ConditionalSliderValue = number | typeof SALES_SKIP_VALUE;

export function getSalesQualificationDefaultValues(
  audience: Audience = "agence",
): SalesQualificationValues {
  const sliders = getSliderConfigs(audience);
  return {
    introConfirmed: false,
    presentationConfirmed: false,
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
  };
}

export const salesQualificationDefaultValues =
  getSalesQualificationDefaultValues("agence");

const SECTION_QUESTION_KEYS: Record<
  Exclude<SalesFunnelSectionId, "rendez-vous">,
  Array<keyof SalesQualificationValues>
> = {
  introduction: ["introConfirmed"],
  "presentation-societe": ["presentationConfirmed"],
  capacite: ["q1", "q2", "q3", "q4", "q5"],
  historique: ["q6", "q7", "q8", "q9", "q10"],
  standards: ["q11", "q12", "q13", "q14"],
  conditions: ["q15", "q16", "q17", "q18", "q19", "q20"],
};

function isConditionalSliderComplete(value: ConditionalSliderValue): boolean {
  return value === SALES_SKIP_VALUE || typeof value === "number";
}

function isFieldComplete(
  key: keyof SalesQualificationValues,
  values: SalesQualificationValues,
  monthlyMin: number,
): boolean {
  const value = values[key];

  if (key === "introConfirmed" || key === "presentationConfirmed") {
    return value === true;
  }

  if (key === "q2Other") {
    return true;
  }

  if (key === "q7" || key === "q13") {
    return value === null || typeof value === "number";
  }

  if (key === "q14") {
    const matrix = values.q14;
    return (
      matrix.months3 >= monthlyMin &&
      matrix.months6 >= monthlyMin &&
      matrix.months12 >= monthlyMin
    );
  }

  if (key === "q15" || key === "q16" || key === "q17" || key === "q18") {
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

  const monthlyMin = getHerculeMonthlyMin(audience);
  const keys = SECTION_QUESTION_KEYS[sectionId];
  const baseComplete = keys.every((key) => isFieldComplete(key, values, monthlyMin));

  if (!baseComplete) {
    return false;
  }

  if (sectionId === "capacite" && values.q2.includes("other")) {
    return Boolean(values.q2Other?.trim());
  }

  return true;
}

const QUALIFICATION_SECTION_IDS: Array<
  Exclude<SalesFunnelSectionId, "rendez-vous">
> = [
  "introduction",
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
  return {
    ...defaults,
    ...partial,
    q14: {
      ...defaults.q14,
      ...partial?.q14,
    },
  };
}

/** @deprecated Use getHerculeMonthlyMin(audience) instead. */
export { HERCULE_MONTHLY_MIN };
