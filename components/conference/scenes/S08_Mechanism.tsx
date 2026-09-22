"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { FlowLine } from "../shared/FlowLine";
import { RubiksCube } from "../shared/RubiksCube";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";
import { StageSubtitle } from "../shared/StageSubtitle";

/**
 * S08 — Le mécanisme  (step 0)
 *
 * 0 – Cube résolu + trois blocs VOLUME → QUALIFICATION → INTÉRÊT
 */
export function S08_Mechanism({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b39"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <SceneLabel size="md" animate={false}>Une solution miracle ?</SceneLabel>
            <RubiksCube state="solved" size={72} spin />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3"
            >
              <SceneLabel size="sm" animate={false}>VOLUME</SceneLabel>
              <FlowLine dir="right" />
              <SceneLabel size="sm" animate={false}>QUALIFICATION</SceneLabel>
              <FlowLine dir="right" />
              <SceneLabel size="sm" animate={false}>INTÉRÊT</SceneLabel>
            </motion.div>
            <StageSubtitle className="max-w-xl">
              Des professionnels solvables, qui viennent vers nous, et en grand nombre.
            </StageSubtitle>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
