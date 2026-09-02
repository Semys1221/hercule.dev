"use client"

import { motion } from "framer-motion"
import { ChevronRight, Users, CheckCircle2, Inbox } from "lucide-react"

export function AISection() {
  return (
    <div className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
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
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-400 text-sm">Demandes en direct</span>
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
            Les demandes clients sont visibles lors de l&apos;audit de compatibilité.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mb-12"
          >
            Lors de l&apos;échange, nous présentons les demandes en attente d&apos;attribution et identifions celles
            compatibles avec le profil de votre agence — en temps réel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="border border-zinc-800 rounded-2xl bg-zinc-900/50 overflow-hidden max-w-2xl"
          >
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
              <Inbox className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium text-sm">Portefeuille de demandes — Audit en cours</span>
              <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">3 en attente</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <Users className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Marie Dupont · Retail Plus · Refonte Shopify</p>
                  <p className="text-zinc-500 text-xs mt-1">Budget 2 000 € · En attente d&apos;attribution</p>
                </div>
              </div>
              <div className="flex items-center justify-center text-zinc-600">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Compatibilité confirmée — apports d&apos;affaires attribués</p>
                  <p className="text-zinc-400 text-xs mt-1">Rendez-vous planifié demain · 10:00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
