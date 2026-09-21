"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { FlowLine }   from "../shared/FlowLine";
import { RubiksCube } from "../shared/RubiksCube";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S08 — Le mécanisme  (steps 0-1, beats 38-39)
 *
 * 0 – Cube en train de se résoudre (face par face)
 * 1 – Cube résolu + trois blocs VOLUME → QUALIFICATION → INTÉRÊT
 */
export function S08_Mechanism({ step }: SceneProps) {
  return (
    <SceneShell>
      <ChapterBadge chapter="Le mécanisme" beat="3/4" />
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b38"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <RubiksCube state="solving" size={88} spin={false} />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="b39"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
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
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
