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

// ─── Silhouette geometry (viewBox 0 0 24 30) ───────────────────
const HEAD = { cx: 12, cy: 5, r: 3.4 };
const BODY =
  "M 5.2 14.9 C 5.2 12.1 8 10.5 12 10.5 C 16 10.5 18.8 12.1 18.8 14.9 C 18.8 19.9 15.6 23.5 12 24 C 8.4 23.5 5.2 19.9 5.2 14.9 Z";

const VB_W = 24;
const VB_H = 30;
const VB_PAD = 1.5;
const MIN_READABLE_SIZE = 28;
const MIN_STROKE_PX = 1.75;

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
  1: { w: 24, h: 30 },
  2: { w: 34, h: 30 },
  3: { w: 44, h: 30 },
  4: { w: 56, h: 32 },
};

function strokeColor(highlighted: boolean, dimmed: boolean) {
  if (dimmed) return "#c4bfb6";
  if (highlighted) return "#1a1a1a";
  return "#6b6560";
}

function strokeWidth(renderWidthPx: number) {
  const minInViewBox = MIN_STROKE_PX * (VB_W / renderWidthPx);
  return Math.max(minInViewBox, 1.8);
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
            stroke="#F4F1EB"
            strokeWidth={maskW}
          />
          <path
            d={BODY}
            fill="none"
            stroke="#F4F1EB"
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
  const sw = strokeWidth(width);

  const sorted = slots
    .map((slot, i) => ({ slot, i }))
    .sort((a, b) => a.slot.z - b.slot.z);

  return (
    <svg
      viewBox={`${-VB_PAD} ${-VB_PAD} ${vb.w + VB_PAD * 2} ${vb.h + VB_PAD * 2}`}
      width={width}
      height={width * (vb.h / vb.w)}
      overflow="visible"
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
    ? "text-muted-foreground"
    : highlighted
      ? "text-foreground"
      : "text-muted-foreground";

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
          className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full border border-foreground bg-foreground text-[7px] text-primary-foreground"
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
  const effectiveSize = Math.max(size, MIN_READABLE_SIZE);
  const clusterScale =
    count > 4 ? Math.max(0.85, MIN_READABLE_SIZE / size) : 1;
  const clusterW = effectiveSize * clusterScale;
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
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-muted-foreground"
          style={{ width: effectiveSize * 0.32, height: effectiveSize * 0.32 }}
          aria-hidden
        >
          <path d={ICON_PATHS[icon]} />
        </svg>
      )}

      {showChecked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 top-0 flex size-3 items-center justify-center rounded-full border border-foreground bg-foreground text-[7px] text-primary-foreground"
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}
