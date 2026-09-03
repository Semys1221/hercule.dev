"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Vous nous décrivez votre besoin",
    description: "Site web, refonte, e-commerce, SEO — vous exposez votre projet et vos contraintes.",
  },
  {
    number: "02",
    title: "Nous qualifions votre projet par téléphone",
    description: "Un échange rapide pour comprendre votre contexte, vos priorités et votre calendrier.",
  },
  {
    number: "03",
    title: "Nous identifions les agences adaptées",
    description:
      "Nous sélectionnons les agences correspondant à votre budget, vos délais et vos objectifs — pas une liste générique.",
  },
  {
    number: "04",
    title: "Nous organisons la mise en relation",
    description: "Vous échangez directement avec l'agence retenue, sans intermédiaire payant de votre côté.",
  },
]

export function HowItWorksSection() {
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
          <span className="text-zinc-400 text-sm">Comment ça fonctionne</span>
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl mb-16"
          style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
        >
          Une agence adaptée à votre besoin, en quatre étapes.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.08 }}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors p-8 rounded-[30px] min-h-[220px] flex flex-col"
            >
              <span className="text-indigo-400 text-sm font-medium mb-4">{step.number}</span>
              <h3 className="text-white font-medium text-xl mb-3">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
