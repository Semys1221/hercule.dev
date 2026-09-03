"use client"

import { motion } from "framer-motion"
import { Check, ChevronRight, Shield } from "lucide-react"

export function ProductDirectionSection() {
  return (
    <section id="pricing" className="relative py-40 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-zinc-400 text-sm">Tarification</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-white max-w-2xl mb-4"
          style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
        >
          Accès aux apports d&apos;affaires. Résiliable à tout moment.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-zinc-400 mb-12 max-w-xl"
        >
          Chaque formule ouvre l&apos;accès à des demandes clients qualifiées, attribuées après audit de
          compatibilité. Un contrat signé à 4 000 € pour 1 489 € d&apos;investissement : retour positif dès la
          première attribution.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="border border-zinc-800 rounded-2xl p-8 bg-zinc-900/30"
          >
            <p className="text-zinc-400 text-sm mb-2">Offre d&apos;entrée</p>
            <p className="text-4xl text-white font-medium mb-2">1 489 €</p>
            <p className="text-zinc-400 text-sm mb-4">
              Cinq apports d&apos;affaires avec demandes qualifiées. En l&apos;absence de signature, cinq nouvelles
              attributions sont replanifiées.
            </p>
            <p className="text-zinc-500 text-sm">Première attribution, risque maîtrisé.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="border border-indigo-500/40 rounded-2xl p-8 bg-indigo-500/5 relative"
          >
            <p className="text-indigo-400 text-sm mb-2">Offre récurrente</p>
            <p className="text-4xl text-white font-medium mb-2">
              2 500 €<span className="text-lg text-zinc-500 font-normal">/mois</span>
            </p>
            <p className="text-zinc-400 text-sm mb-4">
              Jusqu&apos;à quatre attributions par mois. Hercule assure la réception des demandes et la mise en
              relation commerciale.
            </p>
            <p className="text-indigo-300 text-sm font-medium">0 % de commission sur vos ventes.</p>
          </motion.div>
        </div>

        <motion.div
          id="garanties"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="border border-zinc-800 rounded-2xl p-8 bg-zinc-900/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white text-xl font-medium">Garantie contre les absences</h3>
          </div>
          <ul className="space-y-3">
            {[
              "Prospect qualifié absent en visioconférence (malgré relance H-24) : rendez-vous non facturé",
              "Rendez-vous de remplacement planifié sans délai",
              "Facturation uniquement pour les décideurs présents en rendez-vous",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-zinc-400 text-sm">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
