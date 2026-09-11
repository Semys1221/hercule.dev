"use client"

import { motion } from "framer-motion"
import { Inbox, Shield, ClipboardCheck } from "lucide-react"

const matchingCards = [
  {
    title: "Missions PME qualifiées",
    description:
      "Des dirigeants PME attendent un cabinet compatible. Les missions sont disponibles dès activation.",
    icon: Inbox,
  },
  {
    title: "Attribution exclusive",
    description:
      "Chaque mission est confiée à un seul cabinet sélectionné, en fonction de son profil et de sa capacité d'absorption.",
    icon: Shield,
  },
  {
    title: "Audit de compatibilité",
    description:
      "Nous vérifions l'adéquation de votre cabinet — secteurs, honoraires, disponibilité — avant toute attribution.",
    icon: ClipboardCheck,
  },
]

export function PilierMatching() {
  return (
    <div className="relative z-20 pt-16 pb-32" style={{ backgroundColor: "#09090B" }}>
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col gap-6 mb-16 max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white"
              style={{
                letterSpacing: "-0.0325em",
                fontWeight: 538,
                lineHeight: 1.1,
              }}
            >
              Nous recevons des demandes PME. Notre rôle : identifier le cabinet le plus adapté.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-zinc-400 leading-relaxed"
            >
              Hercule met en relation des missions de optimisation fiscale avec les cabinets éligibles. Chaque attribution
              repose sur un audit préalable et une distribution en exclusivité.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchingCards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors p-8 rounded-[30px] min-h-[280px] flex flex-col"
                >
                  <div className="size-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
                    <Icon className="size-5 text-zinc-300" />
                  </div>
                  <h3 className="text-white font-medium text-xl mb-3">{card.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{card.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
