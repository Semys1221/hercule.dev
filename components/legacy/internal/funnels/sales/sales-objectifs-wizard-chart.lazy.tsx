"use client";

import dynamic from "next/dynamic";

import type { SalesObjectifsWizardChartProps } from "./sales-objectifs-wizard-chart";

function ChartLoading({ variant }: { variant?: "panel" | "hero" | "peek" | "moment" }) {
  const heightClass =
    variant === "peek"
      ? "h-[min(22vh,200px)]"
      : variant === "moment"
        ? "h-[min(28vh,260px)]"
        : "h-[min(52vh,520px)]";

  return (
    <div
      className={`${heightClass} w-full animate-pulse rounded-lg border border-dashed border-border bg-muted/20`}
    />
  );
}

const SalesObjectifsWizardChart = dynamic(
  () =>
    import("./sales-objectifs-wizard-chart").then((module) => ({
      default: module.SalesObjectifsWizardChart,
    })),
  {
    ssr: false,
    loading: () => <ChartLoading />,
  },
);

export function SalesObjectifsWizardChartLazy(props: SalesObjectifsWizardChartProps) {
  return <SalesObjectifsWizardChart {...props} />;
}
