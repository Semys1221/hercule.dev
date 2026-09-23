"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HERCULE_MARK_LEFT, HERCULE_MARK_RIGHT } from "@/components/hercule-mark";

type GlassHerculeMarkProps = {
  className?: string;
};

const FLOAT = {
  duration: 6.5,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

const SWEEP = {
  duration: 4.8,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

/**
 * Hero mark for the ivory stage. White glass: frosted body, a bright rim,
 * soft inner swirls, a specular sweep, and a slow float. The header mark
 * stays SilverHerculeMark.
 */
export function GlassHerculeMark({ className }: GlassHerculeMarkProps) {
  const uid = useId().replace(/:/g, "");
  const leftGlass = `hercule-glass-l-${uid}`;
  const rightGlass = `hercule-glass-r-${uid}`;
  const depth = `hercule-glass-depth-${uid}`;
  const leftClip = `hercule-glass-cl-${uid}`;
  const rightClip = `hercule-glass-cr-${uid}`;

  return (
    <motion.div
      className={cn("relative", className)}
      role="img"
      aria-label="Hercule"
      animate={{ y: [0, -8, 0] }}
      transition={FLOAT}
      style={{
        transformStyle: "preserve-3d",
        filter: "drop-shadow(0 16px 20px rgba(42, 36, 30, 0.2))",
      }}
    >
      <svg viewBox="0 0 24 24" className="size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={leftGlass} x1="0.1" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#F1F2F4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D6D9DE" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={rightGlass} x1="0.9" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#EEF0F2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D2D5DA" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id={depth} x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stopColor="#8A9099" stopOpacity="0" />
            <stop offset="100%" stopColor="#8A9099" stopOpacity="0.28" />
          </linearGradient>
          <clipPath id={leftClip}>
            <path d={HERCULE_MARK_LEFT} />
          </clipPath>
          <clipPath id={rightClip}>
            <path d={HERCULE_MARK_RIGHT} />
          </clipPath>
        </defs>

        <path
          d={HERCULE_MARK_LEFT}
          fill="none"
          stroke="rgba(110, 116, 126, 0.5)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d={HERCULE_MARK_RIGHT}
          fill="none"
          stroke="rgba(110, 116, 126, 0.5)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d={HERCULE_MARK_LEFT} fill={`url(#${leftGlass})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${rightGlass})`} />
        <path d={HERCULE_MARK_LEFT} fill={`url(#${depth})`} />
        <path d={HERCULE_MARK_RIGHT} fill={`url(#${depth})`} />
        <path
          d={HERCULE_MARK_LEFT}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.42"
          strokeLinejoin="round"
        />
        <path
          d={HERCULE_MARK_RIGHT}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.42"
          strokeLinejoin="round"
        />

        <g clipPath={`url(#${leftClip})`} opacity={0.7}>
          <motion.ellipse
            cx={4.6}
            cy={16.4}
            rx={3.4}
            ry={1.5}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.5}
            animate={{ rotate: [-18, 12, -18] }}
            transition={{ ...FLOAT, duration: 9 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>
        <g clipPath={`url(#${rightClip})`} opacity={0.65}>
          <motion.ellipse
            cx={19.4}
            cy={8.2}
            rx={3}
            ry={1.3}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.45}
            animate={{ rotate: [16, -14, 16] }}
            transition={{ ...FLOAT, duration: 10 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>

        <g clipPath={`url(#${leftClip})`}>
          <motion.rect
            y={-10}
            width={3.2}
            height={44}
            fill="rgba(255,255,255,0.85)"
            initial={{ x: -16, rotate: 26 }}
            animate={{ x: [-16, 22], rotate: 26 }}
            transition={SWEEP}
          />
        </g>
        <g clipPath={`url(#${rightClip})`}>
          <motion.rect
            y={-10}
            width={3.2}
            height={44}
            fill="rgba(255,255,255,0.75)"
            initial={{ x: -8, rotate: 26 }}
            animate={{ x: [-8, 28], rotate: 26 }}
            transition={{ ...SWEEP, delay: 0.35 }}
          />
        </g>
      </svg>
    </motion.div>
  );
}
