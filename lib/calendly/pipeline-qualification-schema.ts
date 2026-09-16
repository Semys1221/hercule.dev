import { z } from "zod";

import { RDV_PER_SALES_DAY } from "@/lib/calendly/pipeline-calculator";

export const PIPELINE_CLOSING_RATE_OPTIONS = [5, 10, 15, 20, 25, 30, 35] as const;
export const PIPELINE_CAPACITY_DAYS_OPTIONS = [2, 5, 10] as const;
export const PIPELINE_HIGH_CLOSING_TIMELINES = ["3m", "6m", "12m"] as const;

/** Curseurs « Résultats possibles » — clients B2B cumulés. */
export const PIPELINE_CLIENT_RESULTS_PAID_3M = {
  min: 1,
  max: 30,
  default: 5,
} as const;

export const PIPELINE_CLIENT_RESULTS_ORGANIC_6M = {
  min: 1,
  max: 50,
  default: 10,
} as const;

export const PIPELINE_ROI_CALL_MODELS = ["1_call", "2_call", "3_call"] as const;
export const PIPELINE_ROI_MEETING_DURATIONS = ["30min", "1h"] as const;
export const PIPELINE_ROI_MATCHES_OBJECTIVE = ["yes", "no"] as const;

export const PIPELINE_ROI_RDV_PER_MONTH = {
  min: 5,
  max: 40,
  default: 20,
} as const;

export const PIPELINE_ROI_BASKET_EUR = {
  min: 1000,
  max: 5000,
  step: 100,
  default: 1500,
} as const;

export const PIPELINE_ROI_CLOSING_RATE = {
  min: 5,
  max: 35,
  default: 20,
} as const;

export const PIPELINE_ROI_PERSONALITY_OPTIONS = [
  {
    field: "roi_personality_artisan" as const,
    label: "Artisan",
    description: "Forte pression sur les tarifications",
  },
  {
    field: "roi_personality_agence_tech" as const,
    label: "Agence tech",
    description: "Beaucoup de questions techniques",
  },
  {
    field: "roi_personality_finance" as const,
    label: "Finance",
    description: "Ouvert au consulting, apprécie une démarche structurée",
  },
] as const;

export function coercePipelineClientCount(
  value: unknown,
  config: { min: number; max: number; default: number },
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return config.default;
  }
  return Math.min(config.max, Math.max(config.min, Math.round(parsed)));
}

export function formatB2bClientCount(count: number): string {
  const safe = Number.isFinite(count) ? Math.round(count) : 0;
  return safe === 1 ? "1 client B2B cumulé" : `${safe} clients B2B cumulés`;
}

export function roiCallModelDivisor(
  model: z.infer<typeof pipelineRoiCallModelSchema>,
): number {
  switch (model) {
    case "1_call":
      return 1;
    case "2_call":
      return 2;
    case "3_call":
      return 3;
    default:
      return 1;
  }
}

export function roiCallModelLabel(
  model: z.infer<typeof pipelineRoiCallModelSchema>,
): string {
  switch (model) {
    case "1_call":
      return "1 call close";
    case "2_call":
      return "2 calls close";
    case "3_call":
      return "3 calls close";
    default:
      return model;
  }
}

/** Legacy capacity days → RDV / mois (4 RDV / jour dédié). */
export function capacityDaysToRdvPerMonth(days: number): number {
  return coercePipelineClientCount(days * RDV_PER_SALES_DAY, PIPELINE_ROI_RDV_PER_MONTH);
}

/** RDV / mois → capacity days (nearest legacy option for live calculator). */
export function rdvPerMonthToCapacityDays(
  rdvPerMonth: number,
): (typeof PIPELINE_CAPACITY_DAYS_OPTIONS)[number] {
  const days = Math.round(rdvPerMonth / RDV_PER_SALES_DAY);
  const options = PIPELINE_CAPACITY_DAYS_OPTIONS;
  return options.reduce((closest, option) =>
    Math.abs(option - days) < Math.abs(closest - days) ? option : closest,
  );
}

export const PIPELINE_BUYER_FIT_FIELDS = [
  "buyer_fit_long_term_growth",
  "buyer_fit_loves_client_exchange",
  "buyer_fit_monthly_results",
] as const;

export type PipelineBuyerFitField = (typeof PIPELINE_BUYER_FIT_FIELDS)[number];

export const PIPELINE_BUYER_FIT_OPTIONS: ReadonlyArray<{
  field: PipelineBuyerFitField;
  label: string;
}> = [
  {
    field: "buyer_fit_long_term_growth",
    label: "Forte volonté de croissance long terme",
  },
  {
    field: "buyer_fit_loves_client_exchange",
    label: "Aime son métier et l'échange avec ses clients",
  },
  {
    field: "buyer_fit_monthly_results",
    label: "Être en mesure de leur délivrer des résultats mensuels",
  },
];

export const pipelineEngagementSchema = z.enum([
  "monthly_growth",
  "one_shot",
]);

export const pipelineRoiCallModelSchema = z.enum(PIPELINE_ROI_CALL_MODELS);
export const pipelineRoiMeetingDurationSchema = z.enum(PIPELINE_ROI_MEETING_DURATIONS);
export const pipelineRoiMatchesObjectiveSchema = z.enum(PIPELINE_ROI_MATCHES_OBJECTIVE);

type LegacyPipelineQualification = {
  capacity_days_per_month?: number;
  closing_rate_min?: number;
};

export function normalizePipelineQualification<
  T extends LegacyPipelineQualification & Record<string, unknown>,
>(value: T): T {
  const roiRdv =
    typeof value.roi_rdv_per_month === "number"
      ? value.roi_rdv_per_month
      : typeof value.capacity_days_per_month === "number"
        ? capacityDaysToRdvPerMonth(value.capacity_days_per_month)
        : PIPELINE_ROI_RDV_PER_MONTH.default;

  const roiClosing =
    typeof value.roi_closing_rate === "number"
      ? value.roi_closing_rate
      : typeof value.closing_rate_min === "number"
        ? value.closing_rate_min
        : PIPELINE_ROI_CLOSING_RATE.default;

  return {
    ...value,
    roi_rdv_per_month: coercePipelineClientCount(roiRdv, PIPELINE_ROI_RDV_PER_MONTH),
    roi_closing_rate: coercePipelineClientCount(roiClosing, PIPELINE_ROI_CLOSING_RATE),
    capacity_days_per_month: rdvPerMonthToCapacityDays(
      coercePipelineClientCount(roiRdv, PIPELINE_ROI_RDV_PER_MONTH),
    ),
    closing_rate_min: coercePipelineClientCount(roiClosing, PIPELINE_ROI_CLOSING_RATE),
  };
}

export const pipelineQualificationSchema = z
  .object({
    slug: z.string().trim().optional(),
    email: z.string().trim().email(),
    company_name: z.string().trim().min(1),
    buyer_fit_long_term_growth: z.boolean(),
    buyer_fit_loves_client_exchange: z.boolean(),
    buyer_fit_monthly_results: z.boolean(),
    services: z.string().trim().min(1),
    client_results_paid_3m: z
      .number()
      .int()
      .min(PIPELINE_CLIENT_RESULTS_PAID_3M.min)
      .max(PIPELINE_CLIENT_RESULTS_PAID_3M.max),
    client_results_organic_6m: z
      .number()
      .int()
      .min(PIPELINE_CLIENT_RESULTS_ORGANIC_6M.min)
      .max(PIPELINE_CLIENT_RESULTS_ORGANIC_6M.max),
    has_strategy: z.boolean(),
    strategy_detail: z.string().trim().optional(),
    objective: z.string().trim().min(1),
    pipeline_liked: z.string().trim().min(1),
    engagement: pipelineEngagementSchema,
    roi_call_model: pipelineRoiCallModelSchema,
    roi_rdv_per_month: z
      .number()
      .int()
      .min(PIPELINE_ROI_RDV_PER_MONTH.min)
      .max(PIPELINE_ROI_RDV_PER_MONTH.max),
    roi_meeting_duration: pipelineRoiMeetingDurationSchema,
    roi_personality_artisan: z.boolean(),
    roi_personality_agence_tech: z.boolean(),
    roi_personality_finance: z.boolean(),
    roi_closing_rate: z
      .number()
      .int()
      .min(PIPELINE_ROI_CLOSING_RATE.min)
      .max(PIPELINE_ROI_CLOSING_RATE.max),
    roi_basket_eur: z
      .number()
      .int()
      .min(PIPELINE_ROI_BASKET_EUR.min)
      .max(PIPELINE_ROI_BASKET_EUR.max),
    roi_matches_objective: pipelineRoiMatchesObjectiveSchema,
    /** Legacy mirror for product calculator compatibility. */
    capacity_days_per_month: z.union([
      z.literal(2),
      z.literal(5),
      z.literal(10),
    ]),
    /** Legacy mirror for product calculator compatibility. */
    closing_rate_min: z.number().int().min(5).max(35),
    high_closing_service: z.string().trim().optional(),
    high_closing_timeline: z.enum(PIPELINE_HIGH_CLOSING_TIMELINES).optional(),
    calendly_login: z.string().trim().optional(),
    zoom_login: z.string().trim().optional(),
    metrics_snapshot: z
      .object({
        activeCount: z.number(),
        prediction30Days: z.number(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    for (const option of PIPELINE_BUYER_FIT_OPTIONS) {
      if (!value[option.field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "buyer fit criterion required",
          path: [option.field],
        });
      }
    }
    if (value.has_strategy && !value.strategy_detail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "strategy_detail required when has_strategy is true",
        path: ["strategy_detail"],
      });
    }
    if (value.roi_closing_rate > 20) {
      if (!value.high_closing_service?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "high_closing_service required when roi_closing_rate > 20",
          path: ["high_closing_service"],
        });
      }
      if (!value.high_closing_timeline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "high_closing_timeline required when roi_closing_rate > 20",
          path: ["high_closing_timeline"],
        });
      }
    }
  });

export type PipelineQualificationInput = z.infer<
  typeof pipelineQualificationSchema
>;

export type PipelineQualificationStored = PipelineQualificationInput & {
  intro_script: string;
  submitted_at: string;
};

export const PIPELINE_QUALIFICATION_SESSION_KEY =
  "hercule_pipeline_qualification_v1";

export function engagementLabel(
  engagement: z.infer<typeof pipelineEngagementSchema>,
): string {
  return engagement === "monthly_growth"
    ? "intégrer le pipeline dans votre croissance d'entreprise"
    : "combler des besoins ponctuellement";
}

export function capacityDaysLabel(days: number): string {
  return `${days} jours / mois`;
}

export function closingTimelineLabel(timeline: string): string {
  switch (timeline) {
    case "3m":
      return "3 mois";
    case "6m":
      return "6 mois";
    case "12m":
      return "12 mois";
    default:
      return timeline;
  }
}
