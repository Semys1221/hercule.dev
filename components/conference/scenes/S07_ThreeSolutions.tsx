"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { RubiksCube } from "../shared/RubiksCube";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

const SOLUTIONS = [
  {
    name: "BOUCHE-À-OREILLE",
    scores: { INTÉRÊT: true, VOLUME: false, QUALITÉ: false },
  },
  {
    name: "LEADS",
    scores: { VOLUME: true, QUALITÉ: true, INTÉRÊT: false },
  },
  {
    name: "GOOGLE ADS",
    scores: { VOLUME: true, INTÉRÊT: true, QUALITÉ: false },
  },
] as const;

/**
 * S07 — Les trois solutions  (steps 0-2, beats 35-37)
 * Each step shows one solution face of the cube.
 */
export function S07_ThreeSolutions({ step }: SceneProps) {
  const sol = SOLUTIONS[step];

  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={`b${35 + step}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-16"
        >
          <RubiksCube state="scrambled" size={88} spin={false} />

          <div className="flex flex-col gap-5">
            <SceneLabel size="lg" animate={false}>{sol.name}</SceneLabel>
            <div className="flex flex-col gap-2 font-mono text-sm">
              {(["VOLUME", "QUALITÉ", "INTÉRÊT"] as const).map((k) => {
                const ok = sol.scores[k];
                return (
                  <motion.p
                    key={k}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (k === "VOLUME" ? 0 : k === "QUALITÉ" ? 0.12 : 0.24) }}
                    className={ok ? "text-foreground" : "text-muted-foreground"}
                  >
                    {k} {ok ? "✓" : "?"}
                  </motion.p>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </SceneShell>
  );
}
