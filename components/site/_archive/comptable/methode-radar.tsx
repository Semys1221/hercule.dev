"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { TerminalSignaux } from "./terminal-signaux"
import { getMarketingCopy, type MarketingAudience } from "@/lib/site/marketing-copy"

type MethodeRadarProps = {
  audience?: MarketingAudience
}

export function MethodeRadar({ audience = "comptable" }: MethodeRadarProps) {
  const copy = getMarketingCopy(audience)

  return (
    <section id="methode" className="relative z-20 py-40 px-6 scroll-mt-24" >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="size-2 rounded-full bg-foreground" />
          <span className="text-muted-foreground text-sm">Méthodologie</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-foreground max-w-2xl mb-16"
          style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
        >
          {copy.methodeRadar.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
        >
          <div>
            <h3 className="text-foreground text-xl font-medium mb-4">{copy.methodeRadar.sectionTitle}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{copy.methodeRadar.sectionBody}</p>
          </div>
          <TerminalSignaux />
        </motion.div>
      </div>
    </section>
  )
}
