import { FOUNDATION_ROI_DISPLAY } from "@/lib/admin/funnels/comptable-sales-copy";
import { buildBleedTrack } from "@/lib/admin/funnels/sales-bleed-track";
import { formatHonorairesLabel } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

const euroFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export type PitchRoiBarId = "guaranteeRdv" | "yearOne";

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
  guaranteeRdvCount: number;
  guaranteeWindowMonths: number;
  yearOneValueEur: number;
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
  const { guaranteeRdvCount, guaranteeWindowMonths, yearOneValueEur } = FOUNDATION_ROI_DISPLAY;

  const bars: PitchRoiBar[] = [
    {
      id: "guaranteeRdv",
      label: "RDV garantis",
      valueEur: guaranteeRdvCount,
      formatted: `${guaranteeRdvCount} RDV B2B`,
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
    guaranteeRdvCount,
    guaranteeWindowMonths,
    yearOneValueEur,
    bars,
  };
}

export function formatPitchRoiCompactSummary(model: PitchRoiModel): {
  guarantee: string;
  yearOne: string;
} {
  return {
    guarantee: model.bars.find((bar) => bar.id === "guaranteeRdv")?.formatted ?? "—",
    yearOne: model.bars.find((bar) => bar.id === "yearOne")?.formatted ?? "—",
  };
}
