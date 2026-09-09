"use client"

import { motion } from "framer-motion"
import { Calendar, Shield, Users, Video, ClipboardCheck } from "lucide-react"

const cabinetStack = [
  { name: "Live Qualification", icon: ClipboardCheck },
  { name: "Attribution exclusive", icon: Shield },
  { name: "Calendly Pro", icon: Calendar },
  { name: "Zoom Pro", icon: Video },
  { name: "Missions PME", icon: Users },
]

export function BandeStack() {
  return (
    <div className="relative z-20 pb-24 pt-8" style={{ backgroundColor: "#09090B" }}>
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-lg text-zinc-300 mb-2"
          >
            Des cabinets partenaires reçoivent des missions PME qualifiées.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-zinc-500 mb-16"
          >
            Tenue, fiscal, obligations administratives : honoraires annuels de 2 400 € à 6 000 €.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6 items-center justify-items-center"
          >
            {cabinetStack.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="text-zinc-200 font-semibold text-lg flex items-center gap-3">
                  <Icon className="size-5 text-zinc-400" strokeWidth={2} />
                  {item.name}
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
