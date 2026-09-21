/** ~4 visio 30 min sur une journée dédiée aux RDV commerciaux. */
export const RDV_PER_SALES_DAY = 4;

export type PipelineCalculatorInput = {
  rdvInPipeline: number;
  prediction30Days: number;
  basketEur: number;
  closingRatePercent: number;
  capacityDaysPerMonth: number;
  rdvPerSalesDay?: number;
};

export type PipelineCalculatorResult = {
  rdvInPipeline: number;
  rdvTreatablePerMonth: number;
  monthsToClearStock: number | null;
  revenuePerRdv: number;
  potentialCaOnStock: number;
  monthlyInflow: number;
  netAccumulationPerMonth: number;
  capacityBelowInflux: boolean;
};

export function computePipelineCalculator(
  input: PipelineCalculatorInput,
): PipelineCalculatorResult {
  const rdvPerSalesDay = input.rdvPerSalesDay ?? RDV_PER_SALES_DAY;
  const rdvTreatablePerMonth = input.capacityDaysPerMonth * rdvPerSalesDay;
  const revenuePerRdv = input.basketEur * (input.closingRatePercent / 100);
  const potentialCaOnStock = input.rdvInPipeline * revenuePerRdv;
  const monthlyInflow = input.prediction30Days;
  const netAccumulationPerMonth = monthlyInflow - rdvTreatablePerMonth;

  const monthsToClearStock =
    rdvTreatablePerMonth > 0
      ? input.rdvInPipeline / rdvTreatablePerMonth
      : null;

  return {
    rdvInPipeline: input.rdvInPipeline,
    rdvTreatablePerMonth,
    monthsToClearStock,
    revenuePerRdv,
    potentialCaOnStock,
    monthlyInflow,
    netAccumulationPerMonth,
    capacityBelowInflux: rdvTreatablePerMonth < monthlyInflow,
  };
}
