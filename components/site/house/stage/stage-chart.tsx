"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { STAGE_TINT, type StageTabId } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"

const CHART_DATA = [
  { day: "Lun", value: 4 },
  { day: "Mar", value: 7 },
  { day: "Mer", value: 5 },
  { day: "Jeu", value: 9 },
  { day: "Ven", value: 11 },
  { day: "Sam", value: 8 },
  { day: "Dim", value: 12 },
]

type StageChartProps = {
  tabId: StageTabId
  compact?: boolean
}

export function StageChart({ tabId, compact }: StageChartProps) {
  const tint = STAGE_TINT[tabId]
  const config = {
    value: { label: "Demandes", color: tint.fill },
  }

  return (
    <StageWindow title="Activité" bodyClassName={compact ? "p-3" : undefined}>
      <ChartContainer config={config} className={compact ? "h-[140px] w-full" : "h-[200px] w-full"}>
        <AreaChart data={CHART_DATA} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={tint.fill}
            fill={tint.fill}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </StageWindow>
  )
}
