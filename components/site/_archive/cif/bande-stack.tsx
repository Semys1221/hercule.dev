"use client"

import { motion } from "framer-motion"
import { Calendar, Shield, Users, Video, ClipboardCheck } from "lucide-react"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

const copy = getMarketingCopy("cif")

const partnerStack = [
  { name: "Qualification live", icon: ClipboardCheck },
  { name: "Zone exclusive", icon: Shield },
  { name: "Calendly Pro", icon: Calendar },
  { name: "Zoom Pro", icon: Video },
  { name: "Attribution exclusive", icon: Users },
]

export function BandeStack() {
  return (
    <div className="relative z-20 pb-24 pt-8" >
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-[1440px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-lg text-foreground mb-2"
          >
            {copy.bandeStack.text}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-16"
          >
            {copy.bandeStack.subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6 items-center justify-items-center"
          >
            {partnerStack.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.name} className="text-foreground font-semibold text-lg flex items-center gap-3">
                  <Icon className="size-5 text-muted-foreground" strokeWidth={2} />
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
