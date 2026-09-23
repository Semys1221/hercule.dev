"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 280, damping: 32 };
const WINDOW = 2;

type SlotPose = {
  rotateY: number;
  x: number;
  z: number;
  opacity: number;
  scale: number;
  zIndex: number;
};

function poseForRelative(rel: number, reduced: boolean, solo: boolean): SlotPose {
  let pose: SlotPose;

  if (reduced) {
    if (rel === 0) pose = { rotateY: 0, x: 0, z: 0, opacity: 1, scale: 1, zIndex: 30 };
    else if (rel === -1) pose = { rotateY: 0, x: -56, z: 0, opacity: 0.35, scale: 0.96, zIndex: 10 };
    else if (rel === 1) pose = { rotateY: 0, x: 40, z: 0, opacity: 0.25, scale: 0.94, zIndex: 5 };
    else pose = { rotateY: 0, x: 0, z: 0, opacity: 0, scale: 0.9, zIndex: 0 };
  } else if (rel === 0) {
    pose = { rotateY: 0, x: 0, z: 0, opacity: 1, scale: 1, zIndex: 30 };
  } else if (rel === -1) {
    pose = { rotateY: 32, x: -52, z: -60, opacity: 0.45, scale: 0.94, zIndex: 20 };
  } else if (rel === 1) {
    pose = { rotateY: -18, x: 28, z: -100, opacity: 0.3, scale: 0.9, zIndex: 10 };
  } else if (rel < -1) {
    pose = { rotateY: 48, x: -80, z: -120, opacity: 0, scale: 0.88, zIndex: 0 };
  } else {
    pose = { rotateY: -28, x: 48, z: -140, opacity: 0, scale: 0.86, zIndex: 0 };
  }

  if (solo && rel !== 0) return { ...pose, opacity: 0 };
  return pose;
}

export type StageCardDeckItem = {
  id: string;
  node: ReactNode;
  dimmed?: boolean;
};

type StageCardDeckProps = {
  items: StageCardDeckItem[];
  activeIndex: number;
  /** At rest only the active card is visible. Neighbors still rotate in and out. */
  solo?: boolean;
  /** No 3D transforms so overflow clipping on card content works. */
  flat?: boolean;
  frameClassName?: string;
  cardClassName?: string;
};

/**
 * Horizontal 3D card deck. `activeIndex` picks the card facing the audience.
 */
export function StageCardDeck({
  items,
  activeIndex,
  solo = false,
  flat = false,
  frameClassName,
  cardClassName,
}: StageCardDeckProps) {
  const reducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const reduced = flat || (hydrated ? Boolean(reducedMotion) : false);

  const visibleIndices = useMemo(() => {
    const start = Math.max(0, activeIndex - WINDOW);
    const end = Math.min(items.length - 1, activeIndex + WINDOW);
    const indices: number[] = [];
    for (let i = start; i <= end; i++) indices.push(i);
    return indices;
  }, [activeIndex, items.length]);

  return (
    <div
      data-stage-bare
      className={cn("relative flex items-center justify-center", frameClassName)}
      style={{ perspective: reduced ? undefined : 1320 }}
    >
      <div
        className="relative size-full"
        style={{ transformStyle: reduced ? undefined : "preserve-3d" }}
      >
        {visibleIndices.map((index) => {
          const item = items[index];
          if (!item) return null;
          const rel = index - activeIndex;
          const pose = poseForRelative(rel, reduced, solo);
          const isActive = rel === 0;

          return (
            <motion.div
              key={item.id}
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                rotateY: pose.rotateY,
                x: pose.x,
                z: pose.z,
                opacity: pose.opacity,
                scale: pose.scale,
                zIndex: pose.zIndex,
              }}
              transition={SPRING}
              style={{
                transformStyle: reduced ? undefined : "preserve-3d",
                pointerEvents: isActive ? "auto" : "none",
              }}
              aria-hidden={!isActive}
            >
              <Card
                className={cn(
                  "gap-3 border-border bg-card/70 shadow-none backdrop-blur-sm supports-[backdrop-filter]:bg-white/70",
                  cardClassName,
                  item.dimmed && "border-border bg-card/80",
                  !isActive && "select-none",
                )}
              >
                {item.node}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
