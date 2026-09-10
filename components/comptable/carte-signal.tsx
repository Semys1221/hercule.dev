"use client"

import {
  Building2,
  FileText,
  Landmark,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ComptableSignal } from "@/lib/admin/funnels/comptable-sales-copy"
import { cn } from "@/lib/utils"

const SIGNAL_ICONS: Record<string, LucideIcon> = {
  creation: Building2,
  dirigeant: Users,
  regime: Scale,
  embauche: Users,
  statuts: Landmark,
}

function getSignalIcon(id: string): LucideIcon {
  return SIGNAL_ICONS[id] ?? FileText
}

export function CarteSignal({ signal }: { signal: ComptableSignal }) {
  const Icon = getSignalIcon(signal.id)

  return (
    <Card
      className={cn(
        "gap-0 rounded-2xl border-zinc-800 bg-zinc-900/50 py-0 shadow-none",
      )}
    >
      <CardHeader className="gap-2 border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10"
          >
            <Icon className="size-4 text-emerald-400" aria-hidden />
          </div>
          <Badge
            variant="outline"
            className="font-medium min-w-0 shrink max-w-[calc(100%-2.5rem)] truncate border-zinc-700 bg-zinc-800/50 text-zinc-300"
          >
            {signal.label}
          </Badge>
        </div>
        <p className="text-zinc-500 text-xs">Dossier généré</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <p className="text-zinc-400 text-sm leading-relaxed">{signal.paperwork}</p>
        <p className="font-mono text-[10px] text-amber-400">[signal] capturé</p>
      </CardContent>
    </Card>
  )
}
