import { FOUNDATION_ROI_DISPLAY } from "@/lib/admin/funnels/comptable-sales-copy";
import { buildBleedTrack } from "@/lib/admin/funnels/sales-bleed-track";
import { formatHonorairesLabel } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export type PitchRoiBarId = "investment" | "guarantee" | "yearOne";

export type PitchRoiBar = {
  id: PitchRoiBarId;
  label: string;
  valueEur: number;
  formatted: string;
};

export type PitchRoiModel = {
  honorairesEur: number;
  honorairesLabel: string;
  gapLabel: string;
  cause: string;
  investment90DaysEur: number;
  guaranteeMrrEur: number;
  yearOneValueEur: number;
  roiMultiple: number;
  roiMultipleLabel: string;
  guaranteeCoversInvestment: boolean;
  bars: PitchRoiBar[];
};

function resolveHonorairesEur(values: SalesQualificationValues): number {
  if (typeof values.q13 === "number" && values.q13 > 0) {
    return values.q13;
  }
  if (typeof values.w3 === "number" && values.w3 > 0) {
    return values.w3;
  }
  return 0;
}

export function buildPitchRoiModel(
  values: SalesQualificationValues,
  audience: Audience,
): PitchRoiModel {
  const bleed = buildBleedTrack(values, audience);
  const honorairesEur = resolveHonorairesEur(values);
  const {
    investment90DaysEur,
    guaranteeMrrEur,
    yearOneValueEur,
  } = FOUNDATION_ROI_DISPLAY;
  const roiMultiple = yearOneValueEur / investment90DaysEur;

  const bars: PitchRoiBar[] = [
    {
      id: "investment",
      label: "Invest. 90 j",
      valueEur: investment90DaysEur,
      formatted: `${euroFormatter.format(investment90DaysEur)} €`,
    },
    {
      id: "guarantee",
      label: "Garantie",
      valueEur: guaranteeMrrEur,
      formatted: `${euroFormatter.format(guaranteeMrrEur)} €`,
    },
    {
      id: "yearOne",
      label: "Année 1",
      valueEur: yearOneValueEur,
      formatted: `${euroFormatter.format(yearOneValueEur)} €`,
    },
  ];

  return {
    honorairesEur,
    honorairesLabel: formatHonorairesLabel(values, audience),
    gapLabel: bleed.gap,
    cause: bleed.cause,
    investment90DaysEur,
    guaranteeMrrEur,
    yearOneValueEur,
    roiMultiple,
    roiMultipleLabel: `×${roiMultiple.toFixed(1).replace(".", ",")}`,
    guaranteeCoversInvestment: guaranteeMrrEur >= investment90DaysEur * 0.7,
    bars,
  };
}

export function formatPitchRoiCompactSummary(model: PitchRoiModel): {
  investment: string;
  guarantee: string;
  yearOne: string;
} {
  return {
    investment: model.bars.find((bar) => bar.id === "investment")?.formatted ?? "—",
    guarantee: model.bars.find((bar) => bar.id === "guarantee")?.formatted ?? "—",
    yearOne: model.bars.find((bar) => bar.id === "yearOne")?.formatted ?? "—",
  };
}
