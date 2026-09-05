"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

type LogType = "scan" | "signal" | "route" | "stats" | "stack"

type LogLine = {
  id: number
  type: LogType
  text: string
}

const LOG_SEQUENCE: Omit<LogLine, "id">[] = [
  { type: "scan", text: "[scan] 1 047 sites monitorés en continu" },
  { type: "signal", text: "[signal] levée de fonds détectée — startup.io" },
  { type: "signal", text: "[signal] changement dirigeant — retail-plus.fr" },
  { type: "signal", text: "[signal] déploiement formulaire cookies — biomarket.com" },
  { type: "route", text: "[route] intention qualifiée → soumission hercule.dev" },
  { type: "stack", text: "[match] SEO · dev backend · refonte · e-commerce" },
  { type: "stats", text: "[stats] +20 nouvelles demandes de clients aujourd'hui" },
  { type: "scan", text: "[scan] analyse intentions en cours..." },
  { type: "signal", text: "[signal] recrutement dev senior — agriweb.fr" },
  { type: "route", text: "[route] demande routée — budget 2 000 € validé" },
  { type: "signal", text: "[signal] refonte site — luxe-digital.com" },
  { type: "route", text: "[route] soumission hercule.dev — queue +1" },
]

const TYPE_COLORS: Record<LogType, string> = {
  scan: "text-zinc-500",
  signal: "text-amber-400",
  route: "text-emerald-400",
  stats: "text-indigo-300",
  stack: "text-cyan-400",
}

const STATS = [
  { label: "Sites surveillés", value: "1 047+" },
  { label: "Captures / jour", value: "20" },
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
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="text-zinc-500 text-xs font-mono ml-2">hercule-scanner — live</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500/80 text-[10px] font-mono">running</span>
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
          <span className={`text-emerald-400 ${cursorVisible ? "opacity-100" : "opacity-0"}`}>▋</span>
        </div>
      </div>

      <div className="sm:w-[140px] flex sm:flex-col gap-3 shrink-0">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center sm:text-left"
          >
            <p className="text-white text-lg font-semibold font-mono">{stat.value}</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
