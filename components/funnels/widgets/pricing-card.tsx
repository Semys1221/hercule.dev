"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Lock } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CALENDLY_AGENCE_URL } from "@/lib/constants";
import type { PricingPlan } from "@/lib/site/pricing-types";
import { cn } from "@/lib/utils";

const METALLIC_TITLE = {
  front: "from-zinc-300 via-zinc-200 to-zinc-400",
  back: "from-zinc-600/40 to-zinc-700/40",
} as const;

function MetallicTitle({ name }: { name: string }) {
  return (
    <span className="relative inline-block mb-1">
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-b bg-clip-text text-transparent translate-y-px select-none text-xl font-medium tracking-[-0.04em] opacity-50",
          METALLIC_TITLE.back,
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          "relative bg-gradient-to-b bg-clip-text text-transparent text-xl font-medium tracking-[-0.04em]",
          METALLIC_TITLE.front,
        )}
      >
        {name}
      </span>
    </span>
  );
}

type GatedDetailsProps = {
  teaserFeatures: string[];
  ghostFeatures: string[];
  compact?: boolean;
};

function GatedDetails({ teaserFeatures, ghostFeatures, compact }: GatedDetailsProps) {
  return (
    <div className={cn("mt-6", compact && "mt-4")}>
      <ul className="space-y-2.5">
        {teaserFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-300">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-neutral-500" />
            {feature}
          </li>
        ))}
      </ul>

      <div
        role="region"
        aria-label="Détails réservés aux membres Hercule"
        className="relative mt-4 rounded-lg border border-white/[0.06] overflow-hidden"
      >
        <ul className="p-4 space-y-2 opacity-[0.15] select-none pointer-events-none" aria-hidden>
          {ghostFeatures.map((feature) => (
            <li key={feature} className="text-sm text-neutral-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0A0A0A]/80 backdrop-blur-[1px] px-4 py-5">
          <div className="flex items-center gap-2 text-neutral-400">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium text-center">Détails réservés aux membres Hercule</span>
          </div>
          <p className="text-xs text-neutral-500 text-center max-w-[240px]">
            Débloqué après validation de votre profil via{" "}
            <a href="#pricing" className="text-neutral-400 underline-offset-2 hover:text-neutral-300 hover:underline">
              l&apos;offre Starter
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export type PricingCardProps = {
  plan: PricingPlan;
  index?: number;
  compact?: boolean;
  gatedTeaserFeatures?: string[];
  gatedGhostFeatures?: string[];
  animated?: boolean;
};

export function PricingCard({
  plan,
  index = 0,
  compact = false,
  gatedTeaserFeatures = [],
  gatedGhostFeatures = [],
  animated = true,
}: PricingCardProps) {
  const [open, setOpen] = useState(false);

  const card = (
    <div
      className={cn(
        "rounded-xl relative overflow-hidden bg-[#0A0A0A]",
        plan.featured
          ? cn(
              "border border-white/[0.22] ring-1 ring-white/[0.06] shadow-[0_0_48px_rgba(255,255,255,0.04)]",
              compact ? "p-5" : "p-8 md:scale-[1.02] md:z-10",
            )
          : plan.profileOnly
            ? cn("border border-dashed border-white/[0.08]", compact ? "p-5" : "p-8")
            : cn("border border-white/[0.08]", compact ? "p-5" : "p-8"),
      )}
    >
      {plan.featured && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage: "linear-gradient(to bottom, black 40%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </>
      )}

      <div className="relative z-10">
        {plan.featured && (
          <span className="absolute top-0 right-0 text-[10px] uppercase tracking-[0.08em] font-medium text-neutral-300 border border-white/20 bg-white/[0.04] rounded-md px-2 py-0.5">
            Recommandé
          </span>
        )}

        {plan.profileOnly && (
          <span className="absolute top-0 right-0 z-20 flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] font-medium text-neutral-500 border border-white/10 bg-white/[0.02] rounded-md px-2 py-0.5">
            <Lock className="w-3 h-3" />
            Réservé aux membres
          </span>
        )}

        {plan.profileOnly ? (
          <>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{plan.label}</p>
            <MetallicTitle name={plan.name} />
            <p className={cn("text-neutral-200 font-semibold tracking-[-0.04em] mb-2", compact ? "text-2xl" : "text-4xl")}>
              {plan.price}
              {plan.priceSuffix && <span className="text-lg text-neutral-500 font-normal">{plan.priceSuffix}</span>}
            </p>
            <p className={cn("text-neutral-400 font-normal leading-snug", compact ? "text-sm" : "text-base")}>
              {plan.tagline}
            </p>
            <GatedDetails
              teaserFeatures={gatedTeaserFeatures}
              ghostFeatures={gatedGhostFeatures}
              compact={compact}
            />
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{plan.label}</p>
            <MetallicTitle name={plan.name} />
            <p className={cn("text-white font-semibold tracking-[-0.04em] mb-2", compact ? "text-2xl" : "text-4xl")}>
              {plan.price}
              {plan.priceSuffix && <span className="text-lg text-neutral-500 font-normal">{plan.priceSuffix}</span>}
            </p>
            <p
              className={cn(
                "mb-4",
                plan.featured
                  ? compact
                    ? "text-sm text-white font-semibold"
                    : "text-base sm:text-lg text-white font-semibold"
                  : "text-sm text-neutral-400",
              )}
            >
              {plan.tagline}
            </p>
            {plan.summary && <p className="text-neutral-400 text-sm mb-4">{plan.summary}</p>}

            {plan.highlight && (
              <p className="text-neutral-300 text-sm font-medium mb-4 border border-white/[0.06] bg-white/[0.02] rounded-lg p-4">
                {plan.highlight}
              </p>
            )}

            {plan.footer && (
              <p className={cn("text-sm mb-6", plan.featured ? "text-white font-medium" : "text-neutral-500")}>
                {plan.footer}
              </p>
            )}

            {plan.featured && !compact && (
              <a
                href={CALENDLY_AGENCE_URL}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Soumettre ma candidature
                <ArrowRight className="size-4" />
              </a>
            )}

            <div className={cn(plan.featured && !compact && "mt-6")}>
              <Collapsible open={open} onOpenChange={setOpen}>
                <div className="border border-white/10 rounded-md overflow-hidden">
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border-0 rounded-none bg-transparent text-neutral-200 text-sm font-medium hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20">
                    Ce qui est inclus
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]">
                    <div className="min-h-0 overflow-hidden">
                      <ul className="space-y-3 px-4 pb-4 pt-3 border-t border-white/[0.06]">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-neutral-400 text-sm">
                            <Check
                              className={cn(
                                "w-4 h-4 mt-0.5 shrink-0",
                                plan.featured ? "text-[#0070F3]" : "text-neutral-400",
                              )}
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!animated) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.25 + index * 0.05 }}
    >
      {card}
    </motion.div>
  );
}
