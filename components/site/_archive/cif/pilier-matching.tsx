"use client"

import { motion } from "framer-motion"
import { Inbox, Shield, ClipboardCheck } from "lucide-react"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

const copy = getMarketingCopy("cif")
const icons = [Inbox, Shield, ClipboardCheck]

export function PilierMatching() {
  return (
    <div className="relative z-20 pt-16 pb-32" >
      <div className="w-full flex justify-center px-6">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col gap-6 mb-16 max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-foreground"
              style={{
                letterSpacing: "-0.0325em",
                fontWeight: 538,
                lineHeight: 1.1,
              }}
            >
              {copy.pilier.headline}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-muted-foreground leading-relaxed"
            >
              {copy.pilier.intro}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {copy.pilier.cards.map((card, index) => {
              const Icon = icons[index] ?? Inbox
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="bg-muted/50 border border-border hover:border-border transition-colors p-8 rounded-[30px] min-h-[280px] flex flex-col"
                >
                  <div className="size-10 rounded-lg bg-muted border border-border flex items-center justify-center mb-6">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="text-foreground font-medium text-xl mb-3">{card.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
