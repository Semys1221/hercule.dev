"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TERMINAL_SIGNAL_LINES } from "@/lib/site/marketing-copy"

type LogType = "scan" | "signal" | "route" | "stats" | "stack"

type LogLine = {
  id: number
  type: LogType
  text: string
}

const LOG_SEQUENCE: Omit<LogLine, "id">[] = [
  { type: "scan", text: "[scan] 847 dirigeants TPE/PME/indépendants (BNC, BIC, TNS) monitorés" },
  { type: "signal", text: "[signal] création SASU BNC détectée — btp-dupont.fr" },
  { type: "signal", text: "[signal] changement expert-comptable BIC — resto-martin.fr" },
  { type: "signal", text: "[signal] échéance TVA T4 — ecom-boutique.com" },
  ...TERMINAL_SIGNAL_LINES.map((line) => ({ type: line.type as LogType, text: line.text })),
  { type: "scan", text: "[scan] analyse intentions en cours..." },
  { type: "signal", text: "[signal] dépassement seuil micro TNS — artisan-leroy.fr" },
  { type: "signal", text: "[signal] reprise comptabilité — services-pro.com" },
]

const TYPE_COLORS: Record<LogType, string> = {
  scan: "text-muted-foreground",
  signal: "text-amber-400",
  route: "text-foreground",
  stats: "text-muted-foreground",
  stack: "text-cyan-400",
}

const STATS = [
  { label: "TPE/PME surveillées", value: "847+" },
  { label: "Projets / jour", value: "12" },
  { label: "Collecte", value: "24/7" },
]

const MAX_VISIBLE_LINES = 14
const LINES_PER_TICK = 3
const TICK_MS = 100

export function TerminalSignaux() {
  const [lines, setLines] = useState<LogLine[]>([])
  const [cursorVisible, setCursorVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) {
      setLines(LOG_SEQUENCE.slice(0, MAX_VISIBLE_LINES).map((line, i) => ({ ...line, id: i })))
      return
    }

    let index = 0
    const logInterval = setInterval(() => {
      const batch: LogLine[] = []
      for (let i = 0; i < LINES_PER_TICK; i++) {
        const entry = LOG_SEQUENCE[index % LOG_SEQUENCE.length]
        index += 1
        batch.push({ ...entry, id: Date.now() + index + i })
      }
      setLines((current) => [...current, ...batch].slice(-MAX_VISIBLE_LINES))
    }, TICK_MS)

    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 200)

    return () => {
      clearInterval(logInterval)
      clearInterval(cursorInterval)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-foreground/5">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/80">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-secondary" />
            <div className="size-2.5 rounded-full bg-secondary" />
            <div className="size-2.5 rounded-full bg-secondary" />
          </div>
          <span className="text-muted-foreground text-xs font-mono ml-2">hercule-scanner — live</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
            <span className="text-muted-foreground text-[10px] font-mono">running</span>
          </span>
        </div>
        <div
          ref={scrollRef}
          className="p-3 h-[180px] overflow-hidden font-mono text-[10px] leading-tight relative"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 100%)",
          }}
        >
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05 }}
                className={`${TYPE_COLORS[line.type]} mb-0.5`}
              >
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>
          <span className={`text-foreground ${cursorVisible ? "opacity-100" : "opacity-0"}`}>▋</span>
        </div>
      </div>

      <div className="sm:w-[140px] flex sm:flex-col gap-3 shrink-0">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-3 text-center sm:text-left"
          >
            <p className="text-foreground text-lg font-semibold font-mono">{stat.value}</p>
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
