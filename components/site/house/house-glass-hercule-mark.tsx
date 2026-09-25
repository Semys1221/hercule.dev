"use client"

import { motion } from "framer-motion"

import { HERCULE_MARK_LEFT, HERCULE_MARK_RIGHT } from "@/components/hercule-mark"
import { cn } from "@/lib/utils"

type HouseGlassHerculeMarkProps = {
  className?: string
}

const IRIS_CYCLE = {
  duration: 11,
  repeat: Infinity,
  ease: "linear" as const,
}

const SWEEP = {
  duration: 5.5,
  repeat: Infinity,
  ease: [0.45, 0, 0.55, 1] as const,
  repeatDelay: 2.4,
}

/** Hero mark — dark tinted glass with iridescent interior and a moving specular sweep. */
export function HouseGlassHerculeMark({ className }: HouseGlassHerculeMarkProps) {
  const idPrefix = "house-hero-glass"
  const leftClip = `${idPrefix}-cl`
  const rightClip = `${idPrefix}-cr`
  const markClip = `${idPrefix}-mark`
  const bodyL = `${idPrefix}-body-l`
  const bodyR = `${idPrefix}-body-r`
  const iris = `${idPrefix}-iris`
  const rim = `${idPrefix}-rim`
  const depth = `${idPrefix}-depth`
  const sweepGrad = `${idPrefix}-sweep`

  return (
    <div
      className={cn("relative isolate", className)}
      role="img"
      aria-label="Hercule"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, rgba(113, 113, 122, 0.07) 0%, rgba(161, 161, 170, 0.04) 45%, transparent 70%)",
          filter: "blur(12px)",
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 24 24"
        className="relative size-full overflow-visible"
        style={{
          filter: "drop-shadow(0 14px 22px rgba(24, 24, 27, 0.09))",
        }}
        aria-hidden
      >
        <defs>
          <clipPath id={leftClip}>
            <path d={HERCULE_MARK_LEFT} />
          </clipPath>
          <clipPath id={rightClip}>
            <path d={HERCULE_MARK_RIGHT} />
          </clipPath>
          <clipPath id={markClip}>
            <path d={HERCULE_MARK_LEFT} />
            <path d={HERCULE_MARK_RIGHT} />
          </clipPath>

          <linearGradient id={bodyL} x1="0.15" y1="0" x2="0.55" y2="1">
            <stop offset="0%" stopColor="#fafafa" stopOpacity="0.82" />
            <stop offset="48%" stopColor="#e4e4e7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#a1a1aa" stopOpacity="0.38" />
          </linearGradient>
          <linearGradient id={bodyR} x1="0.85" y1="0" x2="0.45" y2="1">
            <stop offset="0%" stopColor="#f4f4f5" stopOpacity="0.8" />
            <stop offset="48%" stopColor="#d4d4d8" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.36" />
          </linearGradient>

          <linearGradient id={depth} x1="0" y1="0" x2="0" y2="1">
            <stop offset="50%" stopColor="#71717a" stopOpacity="0" />
            <stop offset="100%" stopColor="#52525b" stopOpacity="0.14" />
          </linearGradient>

          <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#d4d4d8" stopOpacity="0.45" />
            <stop offset="62%" stopColor="#c4b5fd" stopOpacity="0.22" />
            <stop offset="82%" stopColor="#bae6fd" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e4e4e7" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id={sweepGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <motion.linearGradient
            id={iris}
            gradientUnits="userSpaceOnUse"
            initial={{ x1: 2, y1: 2, x2: 22, y2: 22 }}
            animate={{
              x1: [2, 20, 4, 2],
              y1: [2, 10, 20, 2],
              x2: [22, 6, 20, 22],
              y2: [22, 18, 8, 22],
            }}
            transition={IRIS_CYCLE}
          >
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.28" />
            <stop offset="28%" stopColor="#c7d2fe" stopOpacity="0.24" />
            <stop offset="52%" stopColor="#fbcfe8" stopOpacity="0.22" />
            <stop offset="76%" stopColor="#fde68a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.18" />
          </motion.linearGradient>
        </defs>

        <path d={HERCULE_MARK_LEFT} fill={`url(#${bodyL})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${bodyR})`} />
        <path d={HERCULE_MARK_LEFT} fill={`url(#${depth})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${depth})`} />

        <g clipPath={`url(#${markClip})`} style={{ mixBlendMode: "overlay" }} opacity={0.42}>
          <rect x={0} y={0} width={24} height={24} fill={`url(#${iris})`} />
        </g>

        <path
          d={HERCULE_MARK_LEFT}
          fill="none"
          stroke={`url(#${rim})`}
          strokeWidth={0.42}
          strokeLinejoin="round"
          opacity={0.55}
        />
        <path
          d={HERCULE_MARK_RIGHT}
          fill="none"
          stroke={`url(#${rim})`}
          strokeWidth={0.42}
          strokeLinejoin="round"
          opacity={0.55}
        />

        <path
          d={HERCULE_MARK_LEFT}
          fill="none"
          stroke="#ffffff"
          strokeWidth={0.22}
          strokeOpacity={0.35}
          strokeLinejoin="round"
        />
        <path
          d={HERCULE_MARK_RIGHT}
          fill="none"
          stroke="#ffffff"
          strokeWidth={0.22}
          strokeOpacity={0.35}
          strokeLinejoin="round"
        />

        <g clipPath={`url(#${leftClip})`} style={{ mixBlendMode: "soft-light" }} opacity={0.85}>
          <motion.rect
            y={-14}
            width={5}
            height={52}
            fill={`url(#${sweepGrad})`}
            initial={{ x: -20, rotate: 22 }}
            animate={{ x: [-20, 28], rotate: 22 }}
            transition={SWEEP}
          />
        </g>
        <g clipPath={`url(#${rightClip})`} style={{ mixBlendMode: "soft-light" }} opacity={0.85}>
          <motion.rect
            y={-14}
            width={5}
            height={52}
            fill={`url(#${sweepGrad})`}
            initial={{ x: -12, rotate: 22 }}
            animate={{ x: [-12, 32], rotate: 22 }}
            transition={{ ...SWEEP, delay: 0.45 }}
          />
        </g>
      </svg>
    </div>
  )
}
