"use client"

import { motion } from "framer-motion"
import { Check, Shield } from "lucide-react"

import { getPricingDocument } from "@/lib/site/pricing-data"

export function BlocGaranties() {
  const document = getPricingDocument("cif")
  const guaranteeSection = document?.guaranteeSection

  if (!guaranteeSection) {
    return null
  }

  return (
    <section id="garanties" className="relative z-20 scroll-mt-24 px-6 py-24" style={{ backgroundColor: "#09090B" }}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <Shield className="size-5 text-neutral-400" />
            <h3 className="text-xl font-medium tracking-[-0.02em] text-white">{guaranteeSection.title}</h3>
          </div>
          <ul className="space-y-3">
            {guaranteeSection.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-neutral-400">
                <Check className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
