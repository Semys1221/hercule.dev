import { cn } from "@/lib/utils"

type StageSplitProps = {
  lead: React.ReactNode
  stage: React.ReactNode
  className?: string
  reverse?: boolean
}

export function StageSplit({ lead, stage, className, reverse }: StageSplitProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-2 lg:items-center",
        reverse && "lg:[&>*:first-child]:order-2",
        className,
      )}
    >
      <div className="flex flex-col gap-4">{lead}</div>
      <div className="min-w-0">{stage}</div>
    </div>
  )
}
