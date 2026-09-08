"use client"

import { motion } from "framer-motion"
import { Target, CircleDollarSign, Handshake } from "lucide-react"

const benefits = [
  {
    title: "Demandes déjà qualifiées",
    description:
      "Indépendants et dirigeants de TPE en reprise de comptabilité, fiscal et obligations administratives — pas une liste froide à prospecter.",
    icon: Target,
  },
  {
    title: "0 % de commission",
    description:
      "Vous conservez vos honoraires. Hercule ne prélève aucune commission sur les mandats signés avec les dirigeants rencontrés.",
    icon: CircleDollarSign,
  },
  {
    title: "Attribution exclusive",
    description:
      "Chaque demande est confiée à un seul cabinet sélectionné selon votre profil, votre zone et votre capacité à absorber de nouveaux dossiers.",
    icon: Handshake,
  },
]

export function TrioAvantages() {
  return (
    <div className="relative z-20 py-40" style={{ backgroundColor: "#09090B" }}>
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
              Pourquoi passer par Hercule plutôt que de chasser seul ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-zinc-400 leading-relaxed"
            >
              Les TPE arrivent avec un besoin concret de reprise. Hercule qualifie le dirigeant, vérifie la
              compatibilité avec votre cabinet et organise la mise en relation.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors p-8 rounded-[30px] min-h-[280px] flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-zinc-300" />
                  </div>
                  <h3 className="text-white font-medium text-xl mb-3">{benefit.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
