"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HerculeMark } from "@/components/hercule-mark";

type HerculeLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  showR2?: boolean;
  className?: string;
  delay?: number;
};

const sizes: Record<NonNullable<HerculeLogoProps["size"]>, string> = {
  sm: "size-8",
  md: "size-14",
  lg: "size-20",
  xl: "size-28",
};

export function HerculeLogo({
  size = "md",
  showName = false,
  showR2 = false,
  className,
  delay = 0,
}: HerculeLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center gap-4", className)}
    >
      <HerculeMark
        variant="mono"
        className={cn(sizesPx[size], "text-foreground")}
      />

      {(showName || showR2) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.25 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-base font-medium tracking-[0.3em] text-foreground md:text-lg">
            HERCULE
          </span>
          {showR2 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: delay + 0.45 }}
              className="text-4xl font-thin leading-none text-zinc-400 md:text-5xl"
            >
              R2
            </motion.span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// pixel-size map (mirroring Tailwind size-* values)
const sizesPx: Record<NonNullable<HerculeLogoProps["size"]>, string> = sizes;
