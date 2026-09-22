"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CubeState = "scrambled" | "solving" | "solved";

type RubiksCubeProps = {
  state?: CubeState;
  size?: number;
  /** Label text for up to 3 visible faces */
  faceLabels?: [string?, string?, string?];
  className?: string;
  spin?: boolean;
};

type GrayLevel = 0 | 1 | 2 | 3 | 4;

const GRAY: Record<GrayLevel, string> = {
  0: "#1a1a1a",
  1: "#3f3f46",
  2: "#71717a",
  3: "#d4d4d8",
  4: "#fafafa",
};

const FACE_KEYS = ["front", "back", "right", "left", "top", "bottom"] as const;
type FaceKey = (typeof FACE_KEYS)[number];

/** 9 stickers per face — scrambled (varied grays) */
const SCRAMBLED: Record<FaceKey, GrayLevel[]> = {
  front:  [3, 1, 4, 2, 0, 3, 1, 4, 2],
  back:   [1, 3, 0, 4, 2, 1, 3, 0, 4],
  right:  [2, 4, 1, 0, 3, 2, 4, 1, 0],
  left:   [4, 0, 2, 3, 1, 4, 0, 2, 3],
  top:    [4, 3, 4, 3, 4, 3, 4, 3, 4],
  bottom: [0, 1, 0, 1, 0, 1, 0, 1, 0],
};

/** Solving — partial convergence */
const SOLVING: Record<FaceKey, GrayLevel[]> = {
  front:  [3, 3, 3, 3, 2, 3, 3, 3, 3],
  back:   [1, 1, 1, 1, 2, 1, 1, 1, 1],
  right:  [2, 2, 2, 2, 3, 2, 2, 2, 2],
  left:   [2, 2, 2, 2, 1, 2, 2, 2, 2],
  top:    [4, 4, 4, 4, 4, 4, 4, 4, 4],
  bottom: [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/** Solved — clean faces with directional lighting baked in */
const SOLVED: Record<FaceKey, GrayLevel[]> = {
  front:  [3, 3, 3, 3, 3, 3, 3, 3, 3],
  back:   [1, 1, 1, 1, 1, 1, 1, 1, 1],
  right:  [2, 2, 2, 2, 2, 2, 2, 2, 2],
  left:   [2, 2, 2, 2, 2, 2, 2, 2, 2],
  top:    [4, 4, 4, 4, 4, 4, 4, 4, 4],
  bottom: [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

function patternsForState(state: CubeState): Record<FaceKey, GrayLevel[]> {
  if (state === "solved") return SOLVED;
  if (state === "solving") return SOLVING;
  return SCRAMBLED;
}

function stickerStyle(level: GrayLevel): CSSProperties {
  const base = GRAY[level];
  const highlight =
    level >= 3 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)";
  const shadow =
    level <= 1 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)";
  return {
    background: `linear-gradient(145deg, ${highlight} 0%, ${base} 45%, ${shadow} 100%)`,
  };
}

type CubeFaceProps = {
  levels: GrayLevel[];
  label?: string;
};

function CubeFace({ levels, label }: CubeFaceProps) {
  return (
    <div className="absolute inset-0 bg-background" style={{ backfaceVisibility: "hidden" }}>
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-px bg-background p-px">
        {levels.map((level, i) => (
          <div key={i} className="min-h-0 min-w-0" style={stickerStyle(level)} />
        ))}
      </div>
      {label && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40">
          <span className="px-1 text-center text-[8px] font-medium leading-tight tracking-[0.14em] text-zinc-200 uppercase">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function buildFaces(half: number) {
  return FACE_KEYS.map((key) => ({
    key,
    tx:
      key === "front"
        ? `translateZ(${half}px)`
        : key === "back"
          ? `rotateY(180deg) translateZ(${half}px)`
          : key === "right"
            ? `rotateY(90deg) translateZ(${half}px)`
            : key === "left"
              ? `rotateY(-90deg) translateZ(${half}px)`
              : key === "top"
                ? `rotateX(90deg) translateZ(${half}px)`
                : `rotateX(-90deg) translateZ(${half}px)`,
  }));
}

const scrambledRotation = { rotateX: 22, rotateY: 45, rotateZ: 6 };
const solvingRotation = { rotateX: 10, rotateY: 225 };
const solvedRotation = { rotateX: 12, rotateY: 405 };

export function RubiksCube({
  state = "scrambled",
  size = 80,
  faceLabels,
  className,
  spin = true,
}: RubiksCubeProps) {
  const half = size / 2;
  const faces = buildFaces(half);
  const patterns = patternsForState(state);

  const targetRotation =
    state === "solving"
      ? solvingRotation
      : state === "solved"
        ? solvedRotation
        : scrambledRotation;

  const spinAnimation =
    state === "solved" && spin
      ? { rotateY: [solvedRotation.rotateY, solvedRotation.rotateY + 360] }
      : targetRotation;

  const spinTransition =
    state === "solved" && spin
      ? { duration: 12, ease: "linear" as const, repeat: Infinity }
      : { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      data-rubiks-cube
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size, perspective: size * 7 }}
      aria-hidden
    >
      <motion.div
        animate={spinAnimation}
        transition={spinTransition}
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {faces.map(({ key, tx }, idx) => {
          const label = faceLabels?.[idx < 3 ? idx : -1 as never];
          return (
            <div
              key={key}
              className="absolute inset-0"
              style={{ transform: tx, transformStyle: "preserve-3d" }}
            >
              <CubeFace levels={patterns[key]} label={label} />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
