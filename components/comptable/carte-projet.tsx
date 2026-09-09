"use client"

import {
  ArrowRight,
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardHeader } from "@/components/ui/card"
import { DemandeFlipCard } from "@/components/demandes/demande-flip-card"
import { DemandeMetaRow } from "@/components/demandes/demande-meta-row"
import { getSecteurConfig } from "@/lib/agence/secteur-config"
import { cn } from "@/lib/utils"
import { CALENDLY_ENTREPRISE_URL } from "@/lib/constants"
import { COMPTABLE_DEMANDE_VERSO_CRITERIA } from "@/lib/commercial/qualification-criteria"
import type { DemandeContrat, DemandeStatus, DemandeTeaser } from "@/lib/demandes-data"
import { Card } from "@/components/ui/card"

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
    <a
      href={CALENDLY_ENTREPRISE_URL}
      className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-3 outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-sm"
    >
      <span className="text-sm font-medium text-zinc-400 transition-colors duration-150 group-hover/card:text-white">
        Postuler
      </span>
      <ArrowRight className="size-4 text-zinc-500 transition-[transform,color] duration-150 group-hover/card:translate-x-0.5 group-hover/card:text-white" />
    </a>
  )
}

export function CarteProjet({ demande }: { demande: DemandeContrat }) {
  const { icon: Icon, badgeClass, iconClass, iconBoxClass } = getSecteurConfig(demande.secteur, "marketing")
  const isAssigned = demande.status === "assigned"

  return (
    <div
      className={cn(
        "group/card relative z-0 block h-full rounded-2xl",
        isAssigned
          ? "hover:opacity-65 transition-opacity duration-500 ease-out"
          : "transition-[transform,box-shadow,border-color] duration-150 ease-out hover:z-20 hover:-translate-y-0.5 focus-within:z-20 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        !isAssigned &&
          "hover:[&_.demande-flip-shell]:border-zinc-600 hover:[&_.demande-flip-shell]:bg-zinc-900/80 hover:[&_.demande-flip-shell]:ring-1 hover:[&_.demande-flip-shell]:ring-white/10",
        isAssigned && "opacity-55 saturate-50 select-none",
      )}
    >
      <DemandeFlipCard
        variant="marketing"
        disabled={isAssigned}
        versoCriteria={COMPTABLE_DEMANDE_VERSO_CRITERIA}
        className="demande-flip-shell border-zinc-800 bg-zinc-900/50"
        versoFields={{
          dureeSouhaitee: demande.dureeSouhaitee,
          horizonResultat: demande.horizonResultat,
          historiqueAgences: demande.historiqueAgences,
        }}
        recto={
          <>
            <CardHeader className="relative gap-2 border-b border-zinc-800 px-5 py-4 pr-12">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      iconBoxClass,
                    )}
                  >
                    <Icon className={cn("size-4", iconClass)} aria-hidden />
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
                <p className="text-emerald-400/90 text-xs font-medium">{demande.origine}</p>
              ) : null}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 px-5 py-4">
              <p className="text-white text-sm font-medium leading-snug">{demande.prestation}</p>
              <div className="mt-auto space-y-2 border-t border-zinc-800/80 pt-3">
                <DemandeMetaRow label="Honoraires" value={demande.budget} variant="marketing" />
                <DemandeMetaRow label="Profil PME" value={demande.taille} variant="marketing" />
              </div>
              {!isAssigned && <PostulerActionBar />}
            </CardContent>
          </>
        }
      />
    </div>
  )
}

export function CarteTeaser({ teaser }: { teaser: DemandeTeaser }) {
  const { icon: Icon, badgeClass, iconClass, iconBoxClass } = getSecteurConfig(teaser.secteur, "marketing")

  return (
    <Card className="h-full min-h-[260px] gap-0 rounded-2xl border-dashed border-zinc-800 bg-zinc-900/30 py-0 shadow-none">
      <CardHeader className="gap-2 border-b border-dashed border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border",
              iconBoxClass,
            )}
          >
            <Icon className={cn("size-4", iconClass)} />
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
