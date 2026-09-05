"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { TerminalSignaux } from "./terminal-signaux"

export function MethodeRadar() {
  return (
    <section id="methode" className="relative z-20 py-40 px-6 scroll-mt-24" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-zinc-400 text-sm">Méthodologie</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-white max-w-2xl mb-16"
          style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
        >
          Acquisition continue des demandes de clients
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
        >
          <div>
            <h3 className="text-white text-xl font-medium mb-4">Comment nous obtenons les demandes de clients</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
            Hercule détecte en continu les signaux d’intention sur plus de 1 000 sites : recrutements, développements, changements d’activité et autres indicateurs. Ces entreprises sont qualifiées puis accompagnées par Hercule pour identifier l’agence la plus adaptée à leur besoin.
            </p>
          </div>
          <TerminalSignaux />
        </motion.div>
      </div>
    </section>
  )
}
