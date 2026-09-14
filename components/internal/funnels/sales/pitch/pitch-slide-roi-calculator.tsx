"use client";

import { BadgeEuro, ShieldCheck, TrendingUp } from "lucide-react";
import { memo, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  FOUNDATION_ROI_ACK_LABEL,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_ROI_ACK_LABEL } from "@/lib/admin/funnels/cif-sales-copy";
import { buildPitchRoiModel } from "@/lib/admin/funnels/sales-pitch-roi";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";

import { MetricTile } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const chartConfig = {
  investment: { label: "Invest. 90 j", color: "var(--chart-2)" },
  guarantee: { label: "Garantie", color: "var(--primary)" },
  yearOne: { label: "Année 1", color: "var(--chart-1)" },
} satisfies ChartConfig;

const BAR_COLORS = ["var(--color-investment)", "var(--color-guarantee)", "var(--color-yearOne)"];

export const PitchSlideRoiCalculator = memo(function PitchSlideRoiCalculator({
  audience,
  form,
  values,
}: PitchSlideBaseProps) {
  const model = useMemo(() => buildPitchRoiModel(values, audience), [audience, values]);
  const isCif = isCifSalesAudience(audience);

  const chartData = model.bars.map((bar) => ({
    id: bar.id,
    label: bar.label,
    value: bar.valueEur,
    formatted: bar.formatted,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          icon={BadgeEuro}
          value={model.bars[0]?.formatted ?? "—"}
          label="Invest. 90 j"
          tone="muted"
        />
        <MetricTile
          icon={ShieldCheck}
          value={model.bars[1]?.formatted ?? "—"}
          label="Garantie MRR"
          tone="primary"
        />
        <MetricTile
          icon={TrendingUp}
          value={model.bars[2]?.formatted ?? "—"}
          label="Valeur an 1"
        />
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [
                  typeof value === "number"
                    ? `${new Intl.NumberFormat("fr-FR").format(value)} €`
                    : "—",
                  "",
                ]}
              />
            }
          />
          <Bar dataKey="value" radius={4}>
            {chartData.map((entry, index) => (
              <Cell key={entry.id} fill={BAR_COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-sm">
          ROI {model.roiMultipleLabel}
        </Badge>
        {model.honorairesLabel !== "—" ? (
          <Badge variant="outline">{model.honorairesLabel}</Badge>
        ) : null}
        {model.gapLabel ? <Badge variant="outline">Écart · {model.gapLabel}</Badge> : null}
        {model.cause ? (
          <Badge variant="outline" className="max-w-xs truncate">
            {model.cause}
          </Badge>
        ) : null}
        {model.guaranteeCoversInvestment ? (
          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
            Plancher contractuel
          </Badge>
        ) : null}
      </div>

      <FormField
        control={form.control}
        name="pRoiAcknowledged"
        render={({ field }) => (
          <FormItem>
            <Field orientation="horizontal">
              <Checkbox
                id="pRoiAcknowledged"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="pRoiAcknowledged" className="text-sm font-normal leading-relaxed">
                {isCif ? CIF_FOUNDATION_ROI_ACK_LABEL : FOUNDATION_ROI_ACK_LABEL}
              </FieldLabel>
            </Field>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
