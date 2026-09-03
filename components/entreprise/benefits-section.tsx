"use client"

import { motion } from "framer-motion"
import { Target, CircleDollarSign, Handshake } from "lucide-react"

const benefits = [
  {
    title: "Sélection sur mesure",
    description:
      "Nous sélectionnons les agences adaptées à votre projet — budget, délais, stack technique — plutôt qu'une liste générique de prestataires.",
    icon: Target,
  },
  {
    title: "Zéro frais pour vous",
    description:
      "Le service de matching est entièrement gratuit pour les entreprises. Vous bénéficiez d'une sélection qualifiée sans payer d'intermédiaire.",
    icon: CircleDollarSign,
  },
  {
    title: "Mise en relation organisée",
    description:
      "Après qualification, nous organisons l'échange avec l'agence retenue. Vous gagnez du temps et évitez de comparer des dizaines de profils seuls.",
    icon: Handshake,
  },
]

export function BenefitsSection() {
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
              Pourquoi passer par Hercule plutôt que de chercher seul ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-zinc-400 leading-relaxed"
            >
              Choisir une agence parmi des dizaines de prestataires qui prétendent tous être les meilleurs est
              chronophage et peu rassurant. Hercule qualifie votre besoin et sélectionne les agences compatibles.
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
