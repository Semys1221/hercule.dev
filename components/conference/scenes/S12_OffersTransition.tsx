"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { FlowLine }   from "../shared/FlowLine";
import { RubiksCube } from "../shared/RubiksCube";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S12 — Transition vers les offres  (steps 0-1, beats 83-84)
 *
 * 0 – Cube se divise → DEC / COURTAGE
 * 1 – Même process, deux marchés
 */
export function S12_OffersTransition({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s12-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-20"
          >
            <RubiksCube state="solved" size={64} spin />
            <div className="flex flex-col gap-5">
              <SceneLabel size="xl" animate={false}>DEC</SceneLabel>
              <SceneLabel size="xl" animate={false}>COURTAGE</SceneLabel>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s12-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex gap-20">
              <SceneLabel size="lg" animate={false}>DEC</SceneLabel>
              <SceneLabel size="lg" animate={false}>COURTAGE</SceneLabel>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <SceneLabel size="sm" animate={false}>VOLUME</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>QUALIFICATION</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>INTÉRÊT</SceneLabel>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
