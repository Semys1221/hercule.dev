import { PIPELINE_PRODUCT_PRICE_EUR } from "@/lib/legacy/calendly/pipeline-dashboard";
import {
  roiCallModelDivisor,
  type pipelineRoiCallModelSchema,
  type pipelineRoiMeetingDurationSchema,
} from "@/lib/legacy/calendly/pipeline-qualification-schema";
import type { z } from "zod";

export type PipelineRoiCalculatorInput = {
  roi_call_model: z.infer<typeof pipelineRoiCallModelSchema>;
  roi_rdv_per_month: number;
  roi_meeting_duration: z.infer<typeof pipelineRoiMeetingDurationSchema>;
  roi_closing_rate: number;
  roi_basket_eur: number;
  pipelineCostMonthly?: number;
};

export type PipelineRoiBar = {
  id: "monthlyRevenue" | "annualRevenue" | "pipelineCost";
  label: string;
  valueEur: number;
};

export type PipelineRoiCalculatorResult = {
  effectiveRdvPerMonth: number;
  signedPerMonth: number;
  monthlyRevenue: number;
  annualRevenue: number;
  pipelineCostMonthly: number;
  roiRatio: number;
  bars: PipelineRoiBar[];
};

export function computeEffectiveRdvPerMonth(input: {
  roi_rdv_per_month: number;
  roi_call_model: z.infer<typeof pipelineRoiCallModelSchema>;
  roi_meeting_duration: z.infer<typeof pipelineRoiMeetingDurationSchema>;
}): number {
  const afterCallModel =
    input.roi_rdv_per_month / roiCallModelDivisor(input.roi_call_model);
  return input.roi_meeting_duration === "1h"
    ? afterCallModel * 0.5
    : afterCallModel;
}

export function formatRoiAssumptionsHint(
  basketEur: number,
  closingRatePercent: number,
): string {
  const basket = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(basketEur);
  return `(avec panier ${basket} et closing ${closingRatePercent} %)`;
}

export function computePipelineStockPotentialCa(input: {
  upcomingCount: number;
  basketEur: number;
  closingRatePercent: number;
}): number {
  const revenuePerRdv = input.basketEur * (input.closingRatePercent / 100);
  return input.upcomingCount * revenuePerRdv;
}

export function computePipelineRoi(
  input: PipelineRoiCalculatorInput,
): PipelineRoiCalculatorResult {
  const effectiveRdvPerMonth = computeEffectiveRdvPerMonth(input);
  const signedPerMonth = effectiveRdvPerMonth * (input.roi_closing_rate / 100);
  const monthlyRevenue = signedPerMonth * input.roi_basket_eur;
  const annualRevenue = monthlyRevenue * 12;
  const pipelineCostMonthly =
    input.pipelineCostMonthly ?? PIPELINE_PRODUCT_PRICE_EUR;
  const roiRatio =
    pipelineCostMonthly > 0 ? monthlyRevenue / pipelineCostMonthly : 0;

  const bars: PipelineRoiBar[] = [
    {
      id: "monthlyRevenue",
      label: "CA mensuel potentiel",
      valueEur: monthlyRevenue,
    },
    {
      id: "annualRevenue",
      label: "CA annuel potentiel",
      valueEur: annualRevenue,
    },
    {
      id: "pipelineCost",
      label: "Coût pipeline / mois",
      valueEur: pipelineCostMonthly,
    },
  ];

  return {
    effectiveRdvPerMonth,
    signedPerMonth,
    monthlyRevenue,
    annualRevenue,
    pipelineCostMonthly,
    roiRatio,
    bars,
  };
}
