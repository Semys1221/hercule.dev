"use client"

import { motion } from "framer-motion"
import { ChevronRight, Users, CheckCircle2, Inbox } from "lucide-react"
import { getMarketingCopy, type MarketingAudience } from "@/lib/site/marketing-copy"

type AuditLiveProps = {
  audience?: MarketingAudience
}

export function AuditLive({ audience = "comptable" }: AuditLiveProps) {
  const copy = getMarketingCopy(audience)

  return (
    <div className="relative z-20 py-40" >
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
            <div className="size-2 rounded-full bg-foreground" />
            <span className="text-muted-foreground text-sm">{copy.auditLive.eyebrow}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl text-foreground max-w-3xl mb-8"
            style={{ letterSpacing: "-0.0325em", fontWeight: 538, lineHeight: 1.1 }}
          >
            {copy.auditLive.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-xl mb-12"
          >
            {copy.auditLive.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="border border-border rounded-2xl bg-muted/50 overflow-hidden max-w-2xl"
          >
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <Inbox className="size-5 text-foreground" />
              <span className="text-foreground font-medium text-sm">{copy.auditLive.panelTitle}</span>
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded">3 attribués</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <Users className="size-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-medium">Marc Lefèvre · BTP Dupont · Reprise tenue + liasse</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Honoraires 3 600 €/an · {copy.auditLive.panelSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center text-muted-foreground">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-foreground/10 border border-foreground/15">
                <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-foreground text-sm font-medium">{copy.auditLive.successLabel}</p>
                  <p className="text-muted-foreground text-xs mt-1">Rendez-vous planifié demain · 10:00</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
