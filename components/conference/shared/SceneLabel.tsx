"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SceneLabelProps = {
  children: React.ReactNode;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  muted?: boolean;
  delay?: number;
  animate?: boolean;
};

/** Sizes tuned for the stage card (centered by SceneShell). */
const sizes: Record<NonNullable<SceneLabelProps["size"]>, string> = {
  xs:  "text-sm    tracking-[0.18em]",
  sm:  "text-base  tracking-[0.22em]",
  md:  "text-lg    tracking-[0.26em]",
  lg:  "text-2xl   tracking-[0.28em]",
  xl:  "text-4xl   tracking-[0.24em]",
  "2xl": "text-6xl tracking-[0.18em]",
};

export function SceneLabel({
  children,
  className,
  size = "md",
  muted = false,
  delay = 0,
  animate = true,
}: SceneLabelProps) {
  return (
    <motion.p
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "font-medium uppercase leading-none",
        sizes[size],
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      {children}
    </motion.p>
  );
}
