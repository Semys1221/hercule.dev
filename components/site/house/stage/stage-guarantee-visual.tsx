"use client"

import { Badge } from "@/components/ui/badge"
import { STAGE_TINT } from "@/components/site/house/stage/stage-tint"
import { cn } from "@/lib/utils"

type GuaranteeVisualKind = "territoire" | "engagement" | "cadrage" | "compatibilite" | "default"

type StageGuaranteeVisualProps = {
  kind: GuaranteeVisualKind
}

export function StageGuaranteeVisual({ kind }: StageGuaranteeVisualProps) {
  const blue = STAGE_TINT.comptable
  const amber = STAGE_TINT.assurance
  const green = STAGE_TINT.agence

  if (kind === "territoire" || kind === "default") {
    return (
      <div className="mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <div className="relative size-16 rounded-md border border-border bg-background">
          <span
            className={cn("absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full", blue.dot)}
          />
        </div>
      </div>
    )
  }

  if (kind === "engagement") {
    return (
      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full w-4/5 rounded-full", amber.dot)} />
        </div>
        <p className="text-xs text-muted-foreground">Engagement de suivi</p>
      </div>
    )
  }

  if (kind === "cadrage") {
    return (
      <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-4">
        {["Besoin", "Périmètre", "Fit"].map((t) => (
          <Badge key={t} variant="secondary" className={green.text}>
            {t}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-8 rounded-lg border border-border bg-muted/20 p-6">
      <span className={cn("size-10 rounded-lg border border-border bg-background shadow-sm", blue.soft)} />
      <span className="h-px w-12 bg-border" />
      <span className={cn("size-10 rounded-lg border border-border bg-background shadow-sm", green.soft)} />
    </div>
  )
}

function guaranteeKindFromTitle(title: string): GuaranteeVisualKind {
  const t = title.toLowerCase()
  if (t.includes("territoire") || t.includes("exclusivité") || t.includes("zone")) return "territoire"
  if (t.includes("visio") || t.includes("engagement")) return "engagement"
  if (t.includes("régime") || t.includes("cadrage")) return "cadrage"
  if (t.includes("compatibilit")) return "compatibilite"
  return "default"
}

export { guaranteeKindFromTitle }
