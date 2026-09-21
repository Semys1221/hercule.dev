"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type FlowDir = "down" | "right";

type FlowLineProps = {
  dir?: FlowDir;
  className?: string;
  delay?: number;
  label?: string;
};

export function FlowLine({ dir = "down", className, delay = 0, label }: FlowLineProps) {
  const isDown = dir === "down";

  return (
    <div className={cn("flex items-center", isDown ? "flex-col gap-0.5" : "flex-row gap-1", className)}>
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay, duration: 0.3 }}
          className="text-[9px] tracking-widest text-zinc-600 uppercase"
        >
          {label}
        </motion.span>
      )}
      <motion.div
        initial={{ [isDown ? "scaleY" : "scaleX"]: 0 }}
        animate={{ [isDown ? "scaleY" : "scaleX"]: 1 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
        style={{ originX: isDown ? undefined : 0, originY: isDown ? 0 : undefined }}
        className={cn(
          "bg-zinc-600",
          isDown ? "h-6 w-px" : "h-px w-6",
        )}
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.2 }}
        className={cn(
          "text-zinc-500",
          isDown ? "text-xs leading-none" : "text-[10px] leading-none",
        )}
      >
        {isDown ? "↓" : "→"}
      </motion.span>
    </div>
  );
}
