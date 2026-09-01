"use client"

import { motion } from "framer-motion"
import { Radar, Phone, CalendarCheck, ChevronRight } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "Capture",
    subtitle: "Détection de signaux",
    description:
      "Nous analysons le web en continu pour identifier les entreprises présentant un besoin avéré : recrutements, dégradation de performance, levées de fonds.",
    icon: Radar,
  },
  {
    step: "02",
    title: "Filtrage",
    subtitle: "Qualification téléphonique",
    description:
      "Nos équipes contactent les dirigeants pour valider leurs besoins, délais et budgets avant tout acheminement.",
    icon: Phone,
  },
  {
    step: "03",
    title: "Livraison",
    subtitle: "Attribution exclusive",
    description:
      "Le prospect qualifié vous est attribué en exclusivité. Le rendez-vous est planifié dans votre calendrier — il vous suffit de conclure la vente.",
    icon: CalendarCheck,
  },
]

export function WorkflowsSection() {
  return (
    <section id="methode" className="relative z-20 py-40 px-6" style={{ backgroundColor: "#09090B" }}>
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
          Capture → Filtrage → Livraison
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/30 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 text-sm font-mono">{item.step}</span>
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white text-xl font-medium mb-1">{item.title}</h3>
                <p className="text-indigo-400/80 text-sm mb-4">{item.subtitle}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
