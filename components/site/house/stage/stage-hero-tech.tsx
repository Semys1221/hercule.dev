"use client"

import { motion } from "framer-motion"

import { BorderBeam } from "@/components/ui/border-beam"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { cn } from "@/lib/utils"

const LINES = [
  { prefix: "sync", text: "ok · eu-west · 12ms" },
  { prefix: "build", text: "release-2026.03.1 · verified" },
  { prefix: "watch", text: "heartbeat · nominal" },
  { prefix: "vault", text: "keys rotated · 14d" },
] as const

export function StageHeroTech() {
  return (
    <div className="relative w-full">
      <StageWindow title="hercule.dev — runtime" className="w-full shadow-md">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border bg-muted/20 p-4 md:p-6",
            "bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
            "bg-size-[24px_24px]",
          )}
        >
          <div className="relative z-10 flex flex-col gap-3 font-mono text-xs md:text-sm">
            {LINES.map((line, index) => (
              <motion.div
                key={line.prefix}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center gap-3 text-muted-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-foreground/70" />
                <span className="text-foreground/80">{line.prefix}</span>
                <span className="text-muted-foreground">{line.text}</span>
              </motion.div>
            ))}
          </div>
          <div className="relative z-10 mt-6 h-1 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full w-1/3 rounded-full bg-foreground/80"
              animate={{ x: ["-100%", "300%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </StageWindow>
      <BorderBeam size={100} duration={10} colorFrom="#a1a1aa" colorTo="#0a0a0a" />
    </div>
  )
}
