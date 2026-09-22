"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S17 — Close  (steps 0-1)
 *
 * 0 – Places limitées
 * 1 – Logo discret
 */
export function S17_Close({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="popLayout">

        {step === 0 && (
          <motion.div key="s17-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 max-w-xs"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`h-9 w-9 border ${i < 9 ? "border-zinc-600/60 bg-zinc-800/50" : "border-zinc-800/40"}`}
              />
            ))}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s17-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-10"
          >
            <div className="absolute opacity-[0.06]">
              <RubiksCube state="solved" size={200} spin />
            </div>
            <p className="text-base tracking-[0.14em] text-zinc-500">
              Les décisions qui façonne l&apos;avenir sont prise aujourd&apos;hui
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
