"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

import { CarteProjet } from "@/components/site/cif/carte-projet"
import { CarteSignal } from "@/components/site/cif/carte-signal"
import { CIF_SIGNALS } from "@/lib/legacy/admin/funnels/cif-sales-copy"
import type { DemandeContrat } from "@/lib/site/demandes-data"

import { getMarketingCopy } from "@/lib/site/marketing-copy"

const SECTION_COPY = getMarketingCopy("cif").grillePipeline

function selectFeaturedDemandes(demandes: DemandeContrat[]): DemandeContrat[] {
  const available = demandes.filter((demande) => demande.status === "available")
  const pool = available.length > 0 ? available : demandes
  return pool.slice(0, 2)
}

type GrillePipelineProps = {
  demandes: DemandeContrat[]
}

export function GrillePipeline({ demandes }: GrillePipelineProps) {
  const featuredDemandes = selectFeaturedDemandes(demandes)

  return (
    <section id="missions" className="relative scroll-mt-24 bg-background px-6 py-40">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 flex items-center gap-2"
        >
          <div className="size-2 rounded-full bg-foreground" />
          <span className="text-sm text-neutral-500">{SECTION_COPY.eyebrow}</span>
          <ChevronRight className="size-4 text-neutral-600" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-4 max-w-2xl text-3xl text-foreground sm:text-4xl md:text-5xl"
          style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
        >
          {SECTION_COPY.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mb-12 max-w-xl text-neutral-400"
        >
          {SECTION_COPY.intro}
        </motion.p>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-medium text-muted-foreground">{SECTION_COPY.demandesLabel}</p>
            <div className="flex flex-col gap-4">
              {featuredDemandes.map((demande) => (
                <CarteProjet key={demande.id} demande={demande} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-medium text-muted-foreground">{SECTION_COPY.signauxLabel}</p>
            <div className="flex flex-col gap-3">
              {CIF_SIGNALS.map((signal) => (
                <CarteSignal key={signal.id} signal={signal} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
