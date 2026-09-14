"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatSliderLabel } from "@/components/internal/funnels/sales/sales-questions";
import {
  buildWizardChartModel,
  getDefaultWizardChartMetric,
  type WizardChartMetricId,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

const chartConfig = {
  statuQuo: {
    label: "Statu quo",
    color: "var(--chart-2)",
  },
  goal: {
    label: "Trajectoire cible",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export type SalesObjectifsWizardChartProps = {
  audience: Audience;
  values: SalesQualificationValues;
  metricId: WizardChartMetricId;
  onMetricChange: (metricId: WizardChartMetricId) => void;
  variant?: "panel" | "hero" | "peek" | "moment";
  showMetricTabs?: boolean;
};

function formatAxisValue(value: number, metricId: WizardChartMetricId): string {
  if (metricId === "metric") {
    return formatSliderLabel(value, "eur");
  }
  return String(value);
}

export function SalesObjectifsWizardChart({
  audience,
  values,
  metricId,
  onMetricChange,
  variant = "panel",
  showMetricTabs,
}: SalesObjectifsWizardChartProps) {
  const model = useMemo(
    () => buildWizardChartModel(values, audience, metricId),
    [audience, metricId, values],
  );

  const isHero = variant === "hero";
  const isPeek = variant === "peek";
  const isMoment = variant === "moment";
  const isImmersive = isHero || isPeek || isMoment;
  const isCif = isCifSalesAudience(audience);
  const metricTabLabel = isCif ? "Encours" : "CA annuel";
  const chartData = model.data.filter(
    (point) => point.statuQuo !== null || point.goal !== null,
  );
  const chartHeightClass = isPeek
    ? "h-[min(22vh,200px)]"
    : isMoment
      ? "h-[min(28vh,260px)]"
      : isHero
        ? "h-[min(52vh,520px)]"
        : "h-[220px]";
  const resolvedShowMetricTabs = showMetricTabs ?? (!isPeek && !isHero);

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isImmersive && "w-full max-w-4xl items-center text-center",
        isPeek && "opacity-80",
      )}
    >
      <div className={cn("flex flex-col gap-2", isImmersive && "w-full items-center")}>
        {!isImmersive ? (
          <p className="text-sm font-medium text-foreground">Écart en direct</p>
        ) : null}
        {resolvedShowMetricTabs ? (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metricId}
            onValueChange={(value) => {
              if (value) {
                onMetricChange(value as WizardChartMetricId);
              }
            }}
            className={cn(
              "grid w-full max-w-md grid-cols-3",
              isImmersive && "mx-auto",
            )}
          >
            <ToggleGroupItem value="metric" className="min-w-0 truncate px-2 text-xs">
              {metricTabLabel}
            </ToggleGroupItem>
            <ToggleGroupItem value="volume" className="min-w-0 truncate px-2 text-xs">
              Volume
            </ToggleGroupItem>
            <ToggleGroupItem value="clients" className="min-w-0 truncate px-2 text-xs">
              Clients
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>

      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className={cn("aspect-auto w-full", chartHeightClass)}
        >
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatAxisValue(value, metricId)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    typeof value === "number"
                      ? formatAxisValue(value, metricId)
                      : "—",
                    name === "goal" ? "Trajectoire cible" : "Statu quo",
                  ]}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="statuQuo"
              stroke="var(--color-statuQuo)"
              fill="var(--color-statuQuo)"
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="goal"
              stroke="var(--color-goal)"
              fill="var(--color-goal)"
              fillOpacity={0.35}
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground",
            chartHeightClass,
            isHero && "w-full",
          )}
        >
          {model.hint}
        </div>
      )}

      {!isImmersive ? (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>{model.hint}</p>
          {model.showGoal ? <p className="text-foreground">Écart : {model.gapLabel}</p> : null}
          {model.annotation ? <p>{model.annotation}</p> : null}
          {model.inactionCaption ? (
            <p className="text-destructive">Coût statu quo : {model.inactionCaption}</p>
          ) : null}
        </div>
      ) : model.showGoal ? (
        <p className="text-xs text-foreground">Écart : {model.gapLabel}</p>
      ) : null}
    </div>
  );
}

export { getDefaultWizardChartMetric };
