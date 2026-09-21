"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { CifMarketingPrimaryCta } from "@/components/site/cif/cif-marketing-cta"
import { CarteProjet, CarteTeaser } from "@/components/site/cif/carte-projet"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

const CARD_WIDTH = "w-[300px] sm:w-[320px]"
const copy = getMarketingCopy("cif")

interface BandeProjetsProps {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function BandeProjets({ demandes, teaser }: BandeProjetsProps) {
  return (
    <div id="demandes" className="relative z-20 py-40 scroll-mt-24" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 text-sm">{copy.bandeProjets.eyebrow}</span>
            <ChevronRight className="size-4 text-zinc-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mb-6"
            style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
          >
            {copy.bandeProjets.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="text-zinc-500 text-sm mb-6"
          >
            {copy.bandeProjets.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-zinc-400 max-w-2xl leading-relaxed"
          >
            {copy.bandeProjets.intro}
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25 }}
        className="relative mt-10 w-full overflow-hidden"
      >
        <Marquee pauseOnHover className="[--duration:45s] [--gap:1rem]">
          {demandes.map((demande) => (
            <div key={demande.id} className={cn(CARD_WIDTH, "shrink-0")}>
              <CarteProjet demande={demande} />
            </div>
          ))}
          {teaser ? (
            <div className={cn(CARD_WIDTH, "shrink-0")}>
              <CarteTeaser teaser={teaser} />
            </div>
          ) : null}
        </Marquee>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r from-[#09090B] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l from-[#09090B] to-transparent" />
      </motion.div>

      <div className="w-full flex justify-center px-6 mt-6">
        <div className="w-full max-w-5xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-zinc-500 text-xs max-w-2xl leading-relaxed"
          >
            {copy.bandeProjets.disclaimer}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="mt-8"
          >
            <CifMarketingPrimaryCta className="inline-flex px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
