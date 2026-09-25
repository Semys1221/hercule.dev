"use client"

import { Area, AreaChart } from "recharts"

import { ChartContainer } from "@/components/ui/chart"

type StageSparklineProps = {
  color: string
  data?: { v: number }[]
  className?: string
}

const DEFAULT = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 5 }, { v: 8 }]

export function StageSparkline({ color, data = DEFAULT, className }: StageSparklineProps) {
  return (
    <ChartContainer config={{ v: { label: "v", color } }} className={className ?? "h-10 w-full"}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={1.5} />
      </AreaChart>
    </ChartContainer>
  )
}
