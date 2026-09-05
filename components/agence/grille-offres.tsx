"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check, ChevronDown, ChevronRight, Lock, Shield } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CALENDLY_AGENCE_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"

const HERCULE_TEASER_FEATURES = [
  "Contrats déjà disponibles — demandes qualifiées dans notre pipeline, pas un démarrage à froid.",
  "Vos tarifs, 0 % commission — chaque contrat signé à vos prix, sans commission.",
  "Jusqu'à 4 clients signés par mois pour votre agence.",
] as const

const HERCULE_GHOST_FEATURES = [
  "Garantie MRR 3 000 €",
  "Signature interne",
  "Avantages Starter",
] as const

const PRICING_PLANS = [
  {
    name: "Hercule Starter",
    label: "Offre d'entrée",
    price: "1 489 €",
    priceSuffix: null as string | null,
    tagline: "5 demandes clients à votre portée",
    summary:
      "Cinq demandes qualifiées sélectionnées selon votre activité et votre capacité. En l’absence de signature, l’attribution est renouvelée. (sous conditions CGV).",
    footer: "Commencez par une première attribution, sans engagement.",
    featured: true,
    profileOnly: false,
    highlight: null as string | null,
    features: [
      "5 demandes dans votre champs d'éligibilité, validées par appel téléphonique selon 5 critères : taille de l'entreprise, durée souhaitée, horizon de résultat, budget mensuel et historique avec les agences.",
      "Attribution exclusive des demandes à votre agence.",
      "Remplacement de toute demande lorsque le prospect est absent au rendez-vous, avec remplacement sous 14 jours ouvrés.",
      "0 % de commission sur les ventes réalisées par votre agence.",
      "Garantie : 1 500 € de MRR minimum, ou 5 rendez-vous supplémentaires offerts (onboarding 48 h, retours post-RDV, présence aux RDV).",
    ],
  },
  {
    name: "Hercule",
    label: "Offre récurrente",
    price: "2 500 €",
    priceSuffix: "/mois",
    tagline: "Nous qualifions et signons nos contrats disponibles pour vous.",
    summary: null as string | null,
    footer: null as string | null,
    featured: false,
    profileOnly: true,
    highlight: null as string | null,
    features: [
      "Éligible sur profil — offre proposée après validation de votre compatibilité.",
      "Contrats déjà disponibles — demandes qualifiées dans notre pipeline, pas un démarrage à froid.",
      "Qualification et signature internes — Hercule qualifie et signe nos contrats disponibles pour votre agence.",
      "Vos tarifs, 0 % commission — chaque contrat signé à vos prix, sans commission.",
      "Jusqu'à 4 attributions par mois pour votre agence.",
      "Garantie : 3 000 € minimum de MRR généré par mois, ou une attribution reportée sur le mois suivant sans frais supplémentaires (≥ 2 attributions/mois, service actif complet).",
      "L'ensemble des avantages de l'offre Starter.",
    ],
  },
] as const

const METALLIC_TITLE = {
  front: "from-zinc-300 via-zinc-200 to-zinc-400",
  back: "from-zinc-600/40 to-zinc-700/40",
} as const

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
  )
}

function GatedDetails() {
  return (
    <div className="mt-6">
      <ul className="space-y-2.5">
        {HERCULE_TEASER_FEATURES.map((feature) => (
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
          {HERCULE_GHOST_FEATURES.map((feature) => (
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
  )
}

function PricingCard({ plan, index }: { plan: (typeof PRICING_PLANS)[number]; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.25 + index * 0.05 }}
      className={cn(
        "rounded-xl relative overflow-hidden bg-[#0A0A0A]",
        plan.featured
          ? "p-8 border border-white/[0.22] ring-1 ring-white/[0.06] shadow-[0_0_48px_rgba(255,255,255,0.04)] md:scale-[1.02] md:z-10"
          : plan.profileOnly
            ? "p-8 border border-dashed border-white/[0.08]"
            : "p-8 border border-white/[0.08]",
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
            <p className="text-4xl text-neutral-200 font-semibold tracking-[-0.04em] mb-2">
              {plan.price}
              {plan.priceSuffix && <span className="text-lg text-neutral-500 font-normal">{plan.priceSuffix}</span>}
            </p>
            <p className="text-base text-neutral-400 font-normal leading-snug">{plan.tagline}</p>
            <GatedDetails />
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{plan.label}</p>
            <MetallicTitle name={plan.name} />
            <p className="text-4xl text-white font-semibold tracking-[-0.04em] mb-2">
              {plan.price}
              {plan.priceSuffix && <span className="text-lg text-neutral-500 font-normal">{plan.priceSuffix}</span>}
            </p>
            <p
              className={cn(
                "mb-4",
                plan.featured ? "text-base sm:text-lg text-white font-semibold" : "text-sm text-neutral-400",
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

            {plan.featured && (
              <a
                href={CALENDLY_AGENCE_URL}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Soumettre ma candidature
                <ArrowRight className="size-4" />
              </a>
            )}

            <div className={cn(plan.featured && "mt-6")}>
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
    </motion.div>
  )
}

export function GrilleOffres() {
  return (
    <section id="pricing" className="relative py-40 px-6 bg-black">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <span className="text-neutral-500 text-sm">Tarification</span>
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-white max-w-2xl mb-4"
          style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
        >
          Accès aux apports d&apos;affaires. Starter sans engagement. Récurrent résiliable avec préavis.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-neutral-400 mb-12 max-w-xl"
        >
          Chaque formule ouvre l&apos;accès à des demandes clients qualifiées, attribuées après audit de
          compatibilité. Un contrat signé à 4 000 € pour 1 489 € d&apos;investissement : retour positif dès la
          première attribution.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr] gap-6 mb-16 items-start">
          {PRICING_PLANS.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        <motion.div
          id="garanties"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="border border-white/[0.08] rounded-xl p-8 bg-[#0A0A0A]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-neutral-400" />
            <h3 className="text-white text-xl font-medium tracking-[-0.02em]">Garantie Hercule Starter</h3>
          </div>
          <ul className="space-y-3">
            {[
              "1 489 € TTC — 5 rendez-vous qualifiés, 0 % de commission sur vos ventes",
              "Prospect absent en visio (malgré relance H-24) : attribution recréditée, remplacement sous 14 jours ouvrés",
              "Moins de 1 500 € de MRR après vos 5 rendez-vous ? 5 rendez-vous supplémentaires offerts",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-neutral-400 text-sm">
                <Check className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
