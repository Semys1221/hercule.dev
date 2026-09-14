"use client";

import {
  ArrowRight,
  Cog,
  Handshake,
  Radar,
  Scan,
  UserRound,
} from "lucide-react";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FOUNDATION_PRICING_PLANS,
  formatFoundationEuros,
} from "@/lib/commercial/constants";
import {
  SLIDERS_DIFF,
  SLIDERS_OFFER_CORE_BULLETS,
  SLIDERS_OFFER_HORIZON_BULLETS,
  SLIDERS_PILLARS,
  SLIDERS_RECAP_TILES,
  SLIDERS_TEMP_QUESTIONS,
  type SlidersSlideDefinition,
  type SlidersOfferId,
  resolveSlidersGoalHero,
} from "@/lib/admin/funnels/sales-sliders";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

import {
  DualClock,
  GlowCard,
  GlowHero,
  MilestoneStrip,
  VersusRow,
} from "../pitch/pitch-primitives";

const PILLAR_ICONS = [Radar, Cog, Handshake] as const;
const CAPTURE_ICONS = [Scan, Radar, UserRound] as const;

const PARTNER_SPLIT = [
  { role: "Capture live", hercule: "Infra + rapports", cabinet: "—" },
  { role: "Inbound", hercule: "—", cabinet: "< 24 h" },
] as const;

type SalesSlidersCanvasProps = {
  slide: SlidersSlideDefinition;
  audience: Audience;
  values: SalesQualificationValues;
  selectedOffer: SlidersOfferId | null;
  onSelectOffer: (offer: SlidersOfferId) => void;
};

export const SalesSlidersCanvas = memo(function SalesSlidersCanvas({
  slide,
  audience,
  values,
  selectedOffer,
  onSelectOffer,
}: SalesSlidersCanvasProps) {
  const goalHero = resolveSlidersGoalHero(values, audience);
  const corePlan = FOUNDATION_PRICING_PLANS.find((plan) => plan.id === "core");
  const horizonPlan = FOUNDATION_PRICING_PLANS.find((plan) => plan.id === "horizon");

  switch (slide.type) {
    case "recap":
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {SLIDERS_RECAP_TILES.map((tile) => (
            <GlowCard key={tile.id} variant="primary" className="min-h-40 justify-center text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {tile.label}
              </p>
              <p className="text-lg font-medium text-foreground">{tile.caption}</p>
            </GlowCard>
          ))}
        </div>
      );

    case "goal":
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          {goalHero.value ? (
            <GlowHero value={goalHero.value} label={goalHero.caption} />
          ) : (
            <GlowCard variant="primary" className="items-center px-10 py-12 text-center">
              <p className="text-2xl font-medium tracking-tight">{goalHero.caption}</p>
            </GlowCard>
          )}
        </div>
      );

    case "deciders":
      return (
        <GlowCard variant="primary" className="items-center px-8 py-16 text-center">
          <p className="text-3xl font-medium tracking-tight md:text-4xl">{slide.canvasTitle}</p>
        </GlowCard>
      );

    case "diff":
      return (
        <VersusRow
          criterion="Modèle"
          loser={`${SLIDERS_DIFF.left.label} · ${SLIDERS_DIFF.left.detail}`}
          winner={`${SLIDERS_DIFF.right.label} · ${SLIDERS_DIFF.right.detail}`}
        />
      );

    case "pillars":
      return (
        <div className="flex w-full flex-wrap items-stretch justify-center gap-3">
          {SLIDERS_PILLARS.map((pillar, index) => {
            const Icon = PILLAR_ICONS[index] ?? Radar;
            return (
              <div key={pillar.id} className="flex items-center gap-2">
                <GlowCard variant="primary" className="min-w-[8rem] items-center text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <p className="text-base font-medium">{pillar.name}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">{pillar.tagline}</p>
                </GlowCard>
                {index < SLIDERS_PILLARS.length - 1 ? (
                  <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
                ) : null}
              </div>
            );
          })}
        </div>
      );

    case "capture":
      return (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {CAPTURE_ICONS.map((Icon, index) => (
              <GlowCard key={index} className="items-center text-center">
                <Icon className="size-8 text-primary" aria-hidden />
                <p className="text-xs text-muted-foreground">Flux {index + 1}</p>
              </GlowCard>
            ))}
          </div>
          <GlowCard variant="primary" className="items-center py-8 text-center">
            <p className="text-2xl font-medium">Capture</p>
            <p className="text-sm text-muted-foreground">Intention légale · au nom du cabinet</p>
          </GlowCard>
        </div>
      );

    case "engine":
      return (
        <div className="flex flex-col gap-4">
          <MilestoneStrip
            milestones={[
              { label: "J+0", detail: "Fondations" },
              { label: "J+60", detail: "Système live" },
              { label: "J+150", detail: "Garantie" },
            ]}
          />
          <DualClock
            leftLabel="Déploiement"
            leftValue={60}
            leftMax={60}
            rightLabel="Garantie"
            rightValue={90}
            rightMax={90}
          />
          <GlowCard variant="primary" className="items-center py-6 text-center">
            <p className="text-2xl font-medium">Engine</p>
          </GlowCard>
        </div>
      );

    case "partner":
      return (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {PARTNER_SPLIT.map((row) => (
              <GlowCard key={row.role} className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium">{row.role}</span>
                <span className="text-center text-primary">{row.hercule}</span>
                <span className="text-center text-muted-foreground">{row.cabinet}</span>
              </GlowCard>
            ))}
          </div>
          <MilestoneStrip
            milestones={[
              { label: "J0", detail: "Onboarding" },
              { label: "J+60", detail: "Live" },
              { label: "12 mois", detail: "Croissance" },
            ]}
          />
        </div>
      );

    case "temp":
      return (
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <p className="text-4xl font-medium tracking-tight md:text-5xl">
            {SLIDERS_TEMP_QUESTIONS[0]}
          </p>
          <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            {SLIDERS_TEMP_QUESTIONS[1]}
          </p>
        </div>
      );

    case "offer":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              id: "core" as const,
              plan: corePlan,
              bullets: SLIDERS_OFFER_CORE_BULLETS,
              featured: false,
            },
            {
              id: "horizon" as const,
              plan: horizonPlan,
              bullets: SLIDERS_OFFER_HORIZON_BULLETS,
              featured: true,
            },
          ].map(({ id, plan, bullets, featured }) => {
            if (!plan) {
              return null;
            }
            const isSelected = selectedOffer === id;
            return (
              <Button
                key={id}
                type="button"
                variant="ghost"
                className="h-auto p-0 text-left hover:bg-transparent"
                onClick={() => onSelectOffer(id)}
              >
                <GlowCard
                  variant={featured ? "primary" : "default"}
                  className={cn(
                    "h-full w-full gap-3 p-5 transition-all hover:scale-[1.01]",
                    isSelected && "ring-2 ring-primary",
                    featured &&
                      "shadow-[0_0_32px_-4px_hsl(var(--primary)/0.3)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl font-medium">{plan.name}</p>
                    {featured ? (
                      <Badge variant="secondary" className="text-[10px]">Recommandé</Badge>
                    ) : null}
                  </div>
                  <p className="text-3xl font-semibold tracking-tight">
                    {formatFoundationEuros(plan.priceCents)}
                    <span className="text-sm font-normal text-muted-foreground">/mois</span>
                  </p>
                  <ul className="flex flex-col gap-2">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="text-sm text-muted-foreground">{bullet}</li>
                    ))}
                  </ul>
                </GlowCard>
              </Button>
            );
          })}
        </div>
      );

    default:
      return null;
  }
});
