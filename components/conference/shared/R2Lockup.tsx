"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SilverHerculeMark } from "./SilverHerculeMark";

type R2LockupProps = {
  markClassName?: string;
  className?: string;
};

const ORIAS_BORDER =
  "linear-gradient(90deg, #C25B3A 0%, #C6A24A 50%, #8FA04A 100%)";

/** Crystal mark, ink wordmark, and the ORIAS-colored R2 badge. */
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
        <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
          Logiciel
        </p>
        <p className="text-lg font-medium tracking-[0.42em] text-foreground">
          HERCULE
        </p>
        <span className="relative inline-flex items-center justify-center rounded-full bg-card px-3 py-1">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              padding: 1,
              background: ORIAS_BORDER,
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="text-xs font-medium tracking-[0.22em]"
            style={{ color: "#1F4E79" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.35 }}
          >
            R2
          </motion.span>
        </span>
      </div>
    </div>
  );
}
