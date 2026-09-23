"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Person } from "../shared/Person";
import { SceneShell } from "../shared/SceneShell";
import { StageSubtitle } from "../shared/StageSubtitle";

/**
 * S03.5 — Point de départ  (step 0)
 *
 * Transition entre les limites du BAO et la prospection froide.
 */
export function S03_5_StartingPoint({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="starting-point"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-8"
          >
            <Person size={52} />
            <div className="rounded border border-zinc-700/60 px-6 py-4">
              <StageSubtitle className="text-left">Point de départ</StageSubtitle>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
