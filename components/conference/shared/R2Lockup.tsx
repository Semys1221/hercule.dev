"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SilverHerculeMark } from "./SilverHerculeMark";

type R2LockupProps = {
  markClassName?: string;
  className?: string;
};

/** Silver mark, wordmark, and R2 badge. Same lockup as the S09 reveal. */
export function R2Lockup({ markClassName = "size-28", className }: R2LockupProps) {
  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <div style={{ perspective: 900 }}>
        <motion.div
          animate={{ rotateY: [-8, 8, -8], y: [-4, 4, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <SilverHerculeMark className={markClassName} />
        </motion.div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-[11px] tracking-[0.28em] text-zinc-500 uppercase">
          Logiciel
        </p>
        <p
          className="bg-clip-text text-lg font-medium tracking-[0.42em] text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #f4f4f5 0%, #a1a1aa 48%, #e4e4e7 100%)",
          }}
        >
          HERCULE
        </p>
        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs tracking-[0.22em] text-zinc-300">
          R2
        </span>
      </div>
    </div>
  );
}
