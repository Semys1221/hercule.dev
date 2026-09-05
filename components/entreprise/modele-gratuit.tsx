"use client"

import { motion } from "framer-motion"
import { ChevronRight, Building2, Briefcase } from "lucide-react"

export function ModeleGratuit() {
  return (
    <section id="modele" className="relative z-20 py-40 px-6 scroll-mt-24" style={{ backgroundColor: "#09090B" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "20%",
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-400 text-sm">Notre modèle</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mb-8"
          style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
        >
          Un service gratuit pour vous. Un modèle transparent.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-zinc-400 max-w-2xl mb-12 leading-relaxed"
        >
          Hercule est une marketplace B2B : vous obtenez une sélection qualifiée d&apos;agences sans payer
          d&apos;intermédiaire. Les agences partenaires financent l&apos;accès aux opportunités commerciales et au
          service de mise en relation.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[30px]"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-medium text-xl mb-3">Entreprise</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Service de matching gratuit. Vous décrivez votre besoin, nous qualifions votre projet et sélectionnons
              une agence adaptée à votre situation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[30px]"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-white font-medium text-xl mb-3">Agence</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Paie pour accéder aux opportunités et au service commercial. Ce modèle permet de vous proposer une
              sélection qualifiée, sans frais de votre côté.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
