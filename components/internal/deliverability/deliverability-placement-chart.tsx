"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DeliverabilityDailySeriesPoint } from "@/lib/admin/deliverability/types";

const chartConfig = {
  inbox: {
    label: "Inbox",
    color: "hsl(var(--chart-1))",
  },
  spam: {
    label: "Spam",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DeliverabilityPlacementChart({
  data,
}: {
  data: DeliverabilityDailySeriesPoint[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune donnée de placement warmup sur la période.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })
          }
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="inbox" stackId="placement" fill="var(--color-inbox)" radius={[0, 0, 0, 0]} />
        <Bar dataKey="spam" stackId="placement" fill="var(--color-spam)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
