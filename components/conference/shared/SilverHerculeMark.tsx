"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HERCULE_MARK_LEFT, HERCULE_MARK_RIGHT } from "@/components/hercule-mark";

type SilverHerculeMarkProps = {
  className?: string;
};

const SWEEP = {
  duration: 5,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

/**
 * Conference crystal mark. Two glass planes, a white edge, and a slow
 * specular sweep. No chromatic fringe — the mark should read as cut crystal
 * on paper, not as a design-tool hologram.
 */
export function SilverHerculeMark({ className }: SilverHerculeMarkProps) {
  const uid = useId().replace(/:/g, "");
  const leftId = `hercule-crystal-l-${uid}`;
  const rightId = `hercule-crystal-r-${uid}`;
  const leftClip = `hercule-crystal-cl-${uid}`;
  const rightClip = `hercule-crystal-cr-${uid}`;

  return (
    <div
      className={cn("relative", className)}
      style={{
        transformStyle: "preserve-3d",
        filter: "drop-shadow(0 16px 22px rgba(42, 36, 30, 0.28))",
      }}
      role="img"
      aria-label="Hercule"
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full overflow-visible"
        style={{ transform: "translateZ(8px)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={leftId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F7FBFF" />
            <stop offset="16%" stopColor="#C5D4E2" />
            <stop offset="48%" stopColor="#6E879C" />
            <stop offset="100%" stopColor="#3E5568" />
          </linearGradient>
          <clipPath id={leftClip}>
            <path d={HERCULE_MARK_LEFT} />
          </clipPath>
        </defs>
        <path
          d={HERCULE_MARK_LEFT}
          fill="none"
          stroke="rgba(42, 58, 72, 0.55)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <path
          d={HERCULE_MARK_LEFT}
          fill={`url(#${leftId})`}
          stroke="#FFFFFF"
          strokeWidth="0.42"
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${leftClip})`}>
          <motion.rect
            y={-8}
            width={5}
            height={40}
            fill="rgba(255,255,255,0.7)"
            initial={{ x: -20, rotate: 28 }}
            animate={{ x: [-20, 28], rotate: 28 }}
            transition={SWEEP}
          />
        </g>
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 size-full overflow-visible"
        style={{ transform: "translateZ(-4px)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={rightId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8F2" />
            <stop offset="16%" stopColor="#E7D0B8" />
            <stop offset="48%" stopColor="#C4956A" />
            <stop offset="100%" stopColor="#8A6244" />
          </linearGradient>
          <clipPath id={rightClip}>
            <path d={HERCULE_MARK_RIGHT} />
          </clipPath>
        </defs>
        <path
          d={HERCULE_MARK_RIGHT}
          fill="none"
          stroke="rgba(92, 62, 40, 0.5)"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <path
          d={HERCULE_MARK_RIGHT}
          fill={`url(#${rightId})`}
          stroke="#FFFFFF"
          strokeWidth="0.42"
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${rightClip})`}>
          <motion.rect
            y={-8}
            width={5}
            height={40}
            fill="rgba(255,255,255,0.7)"
            initial={{ x: -20, rotate: 28 }}
            animate={{ x: [-20, 28], rotate: 28 }}
            transition={SWEEP}
          />
        </g>
      </svg>
    </div>
  );
}
