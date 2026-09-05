"use client"

import { motion } from "framer-motion"
import { Check, ChevronRight, Shield } from "lucide-react"

import { PricingCard } from "@/components/funnels/widgets/pricing-card"
import { getPricingDocument } from "@/lib/site/pricing-data"

export function GrilleOffres() {
  const document = getPricingDocument("agence")
  if (!document) {
    return null
  }

  const { hero, plans, guaranteeSection, gatedTeaserFeatures, gatedGhostFeatures } = document

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
          <span className="text-neutral-500 text-sm">{hero.eyebrow}</span>
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
          {hero.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-neutral-400 mb-12 max-w-xl"
        >
          {hero.intro}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr] gap-6 mb-16 items-start">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              index={index}
              gatedTeaserFeatures={gatedTeaserFeatures}
              gatedGhostFeatures={gatedGhostFeatures}
            />
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
            <h3 className="text-white text-xl font-medium tracking-[-0.02em]">{guaranteeSection.title}</h3>
          </div>
          <ul className="space-y-3">
            {guaranteeSection.items.map((item) => (
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
