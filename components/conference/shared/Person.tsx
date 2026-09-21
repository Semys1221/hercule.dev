"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PersonIcon =
  | "none"
  | "briefcase"
  | "stethoscope"
  | "fork"
  | "hammer";

const ICON_PATHS: Record<Exclude<PersonIcon, "none">, string> = {
  briefcase:
    "M6 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2ZM8 7h8V5H8v2Z",
  stethoscope:
    "M10 6a4 4 0 0 1 8 0v4c0 2.2-1.8 4-4 4s-4-1.8-4-4V6ZM4 9h3M4 9a3 3 0 0 0 3 3v1a5 5 0 0 0 10 0",
  fork:
    "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 1-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  hammer:
    "m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9m3 3 2-3.5-3-3L12 9m3 3-3-3M5 21l-1.5-1.5M9 3l3 3",
};

// ─── Silhouette geometry (viewBox 0 0 24 28) ───────────────────
const HEAD = { cx: 12, cy: 6.5, r: 3.8 };
const BODY =
  "M 5.2 12.2 C 5.2 9.4 8 7.8 12 7.8 C 16 7.8 18.8 9.4 18.8 12.2 C 18.8 17.2 15.6 20.8 12 21.3 C 8.4 20.8 5.2 17.2 5.2 12.2 Z";

const VB_W = 24;
const VB_H = 28;

type SilhouetteSlot = {
  x: number;
  y?: number;
  z: number;
  mask?: boolean;
};

/** Render order: back → front */
const LAYOUTS: Record<1 | 2 | 3 | 4, SilhouetteSlot[]> = {
  1: [{ x: 0, z: 0 }],
  2: [
    { x: 10, z: 0 },
    { x: 4, z: 1, mask: true },
  ],
  3: [
    { x: 0, z: 0 },
    { x: 20, z: 0 },
    { x: 10, z: 1, mask: true },
  ],
  4: [
    { x: 0, y: 2, z: 0 },
    { x: 14, y: 2, z: 0 },
    { x: 28, y: 2, z: 0 },
    { x: 14, y: 0, z: 1, mask: true },
  ],
};

const CLUSTER_VB: Record<1 | 2 | 3 | 4, { w: number; h: number }> = {
  1: { w: 24, h: 28 },
  2: { w: 34, h: 28 },
  3: { w: 44, h: 28 },
  4: { w: 52, h: 30 },
};

function strokeColor(highlighted: boolean, dimmed: boolean) {
  if (dimmed) return "#3f3f46";
  if (highlighted) return "#e4e4e7";
  return "#71717a";
}

function strokeWidth(size: number) {
  return Math.max(1.1, size * 0.055);
}

type PersonSilhouetteProps = {
  x: number;
  y?: number;
  mask?: boolean;
  highlighted: boolean;
  dimmed: boolean;
  sw: number;
};

function PersonSilhouette({
  x,
  y = 0,
  mask,
  highlighted,
  dimmed,
  sw,
}: PersonSilhouetteProps) {
  const color = strokeColor(highlighted, dimmed);
  const maskW = sw + 2.2;

  return (
    <g transform={`translate(${x} ${y})`}>
      {mask && (
        <>
          <circle
            cx={HEAD.cx}
            cy={HEAD.cy}
            r={HEAD.r}
            fill="none"
            stroke="#09090b"
            strokeWidth={maskW}
          />
          <path
            d={BODY}
            fill="none"
            stroke="#09090b"
            strokeWidth={maskW}
            strokeLinejoin="round"
          />
        </>
      )}
      <circle
        cx={HEAD.cx}
        cy={HEAD.cy}
        r={HEAD.r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
      />
      <path
        d={BODY}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </g>
  );
}

type PersonClusterSvgProps = {
  layoutSize: 1 | 2 | 3 | 4;
  width: number;
  highlights: boolean[];
};

function PersonClusterSvg({ layoutSize, width, highlights }: PersonClusterSvgProps) {
  const slots = LAYOUTS[layoutSize];
  const vb = CLUSTER_VB[layoutSize];
  const sw = strokeWidth(width / (layoutSize === 1 ? 1 : layoutSize * 0.85));

  const sorted = slots
    .map((slot, i) => ({ slot, i }))
    .sort((a, b) => a.slot.z - b.slot.z);

  return (
    <svg
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      width={width}
      height={width * (vb.h / vb.w)}
      aria-hidden
    >
      {sorted.map(({ slot, i }) => (
        <PersonSilhouette
          key={i}
          x={slot.x}
          y={slot.y}
          mask={slot.mask}
          highlighted={highlights[i] ?? true}
          dimmed={!(highlights[i] ?? true)}
          sw={sw}
        />
      ))}
    </svg>
  );
}

/** Decompose count into clusters of 4, then 3, then remainder */
function decomposeCount(count: number): (1 | 2 | 3 | 4)[] {
  const out: (1 | 2 | 3 | 4)[] = [];
  let n = count;
  while (n > 0) {
    if (n >= 4) {
      out.push(4);
      n -= 4;
    } else if (n >= 3) {
      out.push(3);
      n -= 3;
    } else {
      out.push(n as 1 | 2);
      n = 0;
    }
  }
  return out;
}

function clusterHighlights(
  clusterSize: number,
  globalStart: number,
  highlightCount?: number,
): boolean[] {
  return Array.from({ length: clusterSize }, (_, i) => {
    if (highlightCount === undefined) return true;
    return globalStart + i < highlightCount;
  });
}

// ─── Person (single) ───────────────────────────────────────────
type PersonProps = {
  size?: number;
  icon?: PersonIcon;
  highlighted?: boolean;
  dimmed?: boolean;
  checked?: boolean;
  delay?: number;
  className?: string;
};

export function Person({
  size = 40,
  icon = "none",
  highlighted = true,
  dimmed = false,
  checked = false,
  delay = 0,
  className,
}: PersonProps) {
  const colorClass = dimmed
    ? "text-zinc-700"
    : highlighted
      ? "text-zinc-200"
      : "text-zinc-500";

  const isHighlight = highlighted && !dimmed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size * (VB_H / VB_W) + (icon !== "none" ? 10 : 0) }}
    >
      <PersonClusterSvg
        layoutSize={1}
        width={size}
        highlights={[isHighlight]}
      />

      {icon !== "none" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("mx-auto", colorClass)}
          style={{ width: size * 0.38, height: size * 0.38 }}
          aria-hidden
        >
          <path d={ICON_PATHS[icon]} />
        </svg>
      )}

      {checked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.15 }}
          className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full border border-zinc-500 bg-zinc-900 text-[7px] text-zinc-300"
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── PersonGroup ───────────────────────────────────────────────
type PersonGroupProps = {
  count: number;
  icon?: PersonIcon;
  highlightCount?: number;
  checked?: boolean;
  className?: string;
  size?: number;
};

export function PersonGroup({
  count,
  icon = "none",
  highlightCount,
  checked = false,
  className,
  size = 36,
}: PersonGroupProps) {
  const clusters = decomposeCount(count);
  const clusterScale = count > 4 ? 0.85 : 1;
  const clusterW = size * clusterScale;
  const gap = count >= 16 ? 3 : count >= 8 ? 4 : 6;

  let globalIdx = 0;
  let lastHighlightCluster = -1;

  const clusterEls = clusters.map((layoutSize, ci) => {
    const highlights = clusterHighlights(layoutSize, globalIdx, highlightCount);
    globalIdx += layoutSize;

    highlights.forEach((h) => {
      if (h) lastHighlightCluster = ci;
    });

    return (
      <PersonClusterSvg
        key={ci}
        layoutSize={layoutSize}
        width={clusterW}
        highlights={highlights}
      />
    );
  });

  const showChecked =
    checked &&
    highlightCount !== undefined &&
    highlightCount > 0 &&
    lastHighlightCluster >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("relative inline-flex flex-wrap items-end justify-center", className)}
      style={{ gap }}
    >
      {clusterEls}

      {icon !== "none" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-zinc-500"
          style={{ width: size * 0.32, height: size * 0.32 }}
          aria-hidden
        >
          <path d={ICON_PATHS[icon]} />
        </svg>
      )}

      {showChecked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 top-0 flex size-3 items-center justify-center rounded-full border border-zinc-500 bg-zinc-900 text-[7px] text-zinc-300"
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}
