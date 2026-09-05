"use client"

import type { ComponentType } from "react"
import {
  ArrowRight,
  Calculator,
  Check,
  TrendingUp,
  Sun,
  Zap,
  Waves,
  Home,
  Package,
  Stethoscope,
  Truck,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CALENDLY_AGENCE_URL } from "@/lib/constants"
import type { DemandeContrat, DemandeStatus, DemandeTeaser } from "@/lib/demandes-data"

const SECTEUR_CONFIG: Record<
  string,
  {
    icon: ComponentType<{ className?: string }>
    badgeClass: string
  }
> = {
  Comptabilité: {
    icon: Calculator,
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  },
  "Conseil financier": {
    icon: TrendingUp,
    badgeClass: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
  },
  Solaire: {
    icon: Sun,
    badgeClass: "border-yellow-500/25 bg-yellow-500/10 text-yellow-400",
  },
  "Pompe à chaleur": {
    icon: Zap,
    badgeClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
  },
  Piscines: {
    icon: Waves,
    badgeClass: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  },
  "Rénovation énergétique": {
    icon: Home,
    badgeClass: "border-orange-500/25 bg-orange-500/10 text-orange-400",
  },
  "Grossiste emballage": {
    icon: Package,
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-400",
  },
  "Fournitures médicales": {
    icon: Stethoscope,
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-400",
  },
  "Distribution professionnelle": {
    icon: Truck,
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  },
  "Santé esthétique": {
    icon: Sparkles,
    badgeClass: "border-zinc-600 bg-zinc-800/80 text-zinc-400",
  },
}

function getSecteurConfig(secteur: string) {
  return (
    SECTEUR_CONFIG[secteur] ?? {
      icon: Package,
      badgeClass: "border-zinc-700 bg-zinc-800 text-zinc-400",
    }
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-300 text-right">{value}</span>
    </div>
  )
}

function DemandeStatusBadge({ status }: { status: DemandeStatus }) {
  if (status === "assigned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-800/90 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 shrink-0">
        <Check className="size-3" aria-hidden="true" />
        Attribué
      </span>
    )
  }

  return null
}

function PostulerActionBar() {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-3">
      <span className="text-sm font-medium text-zinc-400 transition-colors duration-150 group-hover/card:text-white">
        Postuler
      </span>
      <ArrowRight className="size-4 text-zinc-500 transition-all duration-150 group-hover/card:translate-x-0.5 group-hover/card:text-white" />
    </div>
  )
}

export function DemandeCard({ demande }: { demande: DemandeContrat }) {
  const { icon: Icon, badgeClass } = getSecteurConfig(demande.secteur)
  const isAssigned = demande.status === "assigned"
  const ariaLabel = isAssigned
    ? `Demande attribuée — ${demande.secteur}, ${demande.zone}`
    : `Postuler — ${demande.secteur}, ${demande.zone}`

  return (
    <a
      href={CALENDLY_AGENCE_URL}
      aria-label={ariaLabel}
      className={cn(
        "group/card relative z-0 block h-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        isAssigned
          ? "hover:opacity-65 transition-opacity duration-500 ease-out"
          : "transition-[transform,box-shadow,border-color] duration-150 ease-out hover:z-20 hover:-translate-y-0.5 focus-visible:z-20 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <Card
        className={cn(
          "relative h-full min-h-[260px] gap-0 overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900/50 py-0 shadow-none transition-[border-color,background-color,box-shadow] duration-150 ease-out",
          !isAssigned &&
            "group-hover/card:border-zinc-600 group-hover/card:bg-zinc-900/80 group-hover/card:ring-1 group-hover/card:ring-white/10",
          isAssigned && "opacity-55 saturate-50 select-none",
        )}
      >
        <CardHeader className="relative gap-2 border-b border-zinc-800 px-5 py-4">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-zinc-300" />
              </div>
              <Badge
                variant="outline"
                className={cn("font-medium min-w-0 shrink max-w-full truncate", badgeClass)}
              >
                {demande.secteur}
              </Badge>
            </div>
            <DemandeStatusBadge status={demande.status} />
          </div>
          <p className="text-zinc-500 text-xs">
            {demande.zone} · {demande.disponibilite}
          </p>
          {demande.origine ? (
            <p className="text-amber-400/90 text-xs font-medium">{demande.origine}</p>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 px-5 py-4">
          <p className="text-white text-sm font-medium leading-snug">{demande.prestation}</p>
          <div className="mt-auto space-y-2 border-t border-zinc-800/80 pt-3">
            <MetaRow label="Budget" value={demande.budget} />
            <MetaRow label="Taille" value={demande.taille} />
          </div>
          {!isAssigned && <PostulerActionBar />}
        </CardContent>
      </Card>
    </a>
  )
}

export function DemandeTeaserCard({ teaser }: { teaser: DemandeTeaser }) {
  const { icon: Icon, badgeClass } = getSecteurConfig(teaser.secteur)

  return (
    <Card className="h-full min-h-[260px] gap-0 rounded-2xl border-dashed border-zinc-800 bg-zinc-900/30 py-0 shadow-none">
      <CardHeader className="gap-2 border-b border-dashed border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-zinc-400" />
          </div>
          <Badge variant="outline" className={cn("font-medium min-w-0 shrink max-w-[calc(100%-2.5rem)] truncate", badgeClass)}>
            {teaser.titre}
          </Badge>
        </div>
        <p className="text-zinc-500 text-xs">En cours de qualification · Bientôt</p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-5 py-4">
        <p className="text-zinc-500 text-sm leading-relaxed">{teaser.description}</p>
        <p className="text-zinc-500 text-xs leading-relaxed mt-auto">{teaser.note}</p>
      </CardContent>
    </Card>
  )
}
