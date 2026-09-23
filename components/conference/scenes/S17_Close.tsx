"use client";

import { motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { RubiksCube } from "../shared/RubiksCube";
import { SceneShell } from "../shared/SceneShell";

/**
 * S17 — Close  (step 0)
 *
 * Phrase + cube contenu dans la carte.
 */
export function S17_Close(_props: SceneProps) {
  return (
    <SceneShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-8"
      >
        <div className="flex size-[13.5rem] items-center justify-center overflow-hidden p-6 opacity-30">
          <RubiksCube
            state="solved"
            size={160}
            spin={false}
            presentation
            presentationPose={{ rotateX: -18, rotateY: 32 }}
          />
        </div>
        <p className="max-w-md text-center text-base tracking-[0.14em] text-zinc-500">
          Les décisions qui façonne l&apos;avenir sont prise aujourd&apos;hui
        </p>
      </motion.div>
    </SceneShell>
  );
}
