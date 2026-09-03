"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ChevronDown, ChevronRight, Shield } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const PRICING_PLANS = [
  {
    name: "Hercule",
    label: "Offre récurrente",
    price: "2 500 €",
    priceSuffix: "/mois",
    tagline: "Jusqu'à 4 nouveaux clients signés par mois par Hercule",
    summary:
      "Jusqu'à quatre attributions par mois. Hercule assure la réception des demandes et la mise en relation commerciale.",
    footer: "0 % de commission sur vos ventes.",
    featured: false,
    features: [
      "Jusqu'à 4 nouveaux clients signés chaque mois par Hercule pour votre agence.",
      "L'ensemble des avantages de l'offre Starter.",
      "Hercule prend en charge la vente de vos prestations auprès des prospects, jusqu'à la signature.",
      "Garantie : 3 000 € minimum de MRR généré par mois, ou une attribution reportée sur le mois suivant sans frais supplémentaires.",
      "0 % de commission sur les ventes réalisées.",
    ],
  },
  {
    name: "Hercule Starter",
    label: "Offre d'entrée",
    price: "1 489 €",
    priceSuffix: null as string | null,
    tagline: "5 attributions de demandes clients",
    summary:
      "Cinq apports d'affaires avec demandes qualifiées. En l'absence de signature, cinq nouvelles attributions sont replanifiées.",
    footer: "Première attribution, risque maîtrisé.",
    featured: true,
    features: [
      "5 demandes clients qualifiées, validées par appel téléphonique selon 5 critères : taille de l'entreprise, durée souhaitée, horizon de résultat, budget mensuel et historique avec les agences.",
      "Attribution exclusive des demandes à votre agence.",
      "Remplacement de toute demande lorsque le prospect est absent au rendez-vous.",
      "0 % de commission sur les ventes réalisées par votre agence.",
      "Garantie : 1 500 € minimum de MRR généré, ou 5 rendez-vous supplémentaires attribués sans frais.",
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

function PricingCard({ plan, index }: { plan: (typeof PRICING_PLANS)[number]; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.25 + index * 0.05 }}
      className={cn(
        "rounded-xl p-8 relative overflow-hidden bg-[#0A0A0A]",
        plan.featured
          ? "border border-white/[0.18] ring-1 ring-white/[0.06]"
          : "border border-white/[0.08]",
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

        <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{plan.label}</p>
        <MetallicTitle name={plan.name} />
        <p className="text-4xl text-white font-semibold tracking-[-0.04em] mb-2">
          {plan.price}
          {plan.priceSuffix && <span className="text-lg text-neutral-500 font-normal">{plan.priceSuffix}</span>}
        </p>
        <p className={cn("text-sm mb-4", plan.featured ? "text-white font-medium" : "text-neutral-400")}>{plan.tagline}</p>
        <p className="text-neutral-400 text-sm mb-4">{plan.summary}</p>
        <p className={cn("text-sm mb-6", plan.featured ? "text-white font-medium" : "text-neutral-500")}>{plan.footer}</p>

        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="border border-white/10 rounded-md overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border-0 rounded-none bg-transparent text-neutral-200 text-sm font-medium hover:bg-white/[0.04] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20">
              Ce qui est inclus
              <ChevronDown
                className={cn("w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-200", open && "rotate-180")}
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
                          plan.featured ? "text-[#0070F3]" : "text-neutral-500",
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
    </motion.div>
  )
}

export function ProductDirectionSection() {
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
          Accès aux apports d&apos;affaires. Résiliable à tout moment.
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 items-start">
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
            <h3 className="text-white text-xl font-medium tracking-[-0.02em]">Garantie contre les absences</h3>
          </div>
          <ul className="space-y-3">
            {[
              "Prospect qualifié absent en visioconférence (malgré relance H-24) : rendez-vous non facturé",
              "Rendez-vous de remplacement planifié sans délai",
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
