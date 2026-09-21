"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { Person }       from "../shared/Person";
import { RubiksCube }   from "../shared/RubiksCube";
import { SceneLabel }   from "../shared/SceneLabel";
import { SceneShell }   from "../shared/SceneShell";

const ORBIT_R = 90;
const ORBIT_WORDS = ["VOLUME", "QUALITÉ", "INTÉRÊT"] as const;

/**
 * S06 — Reframing  (steps 0-4, beats 30-34)
 *
 * 0 – Découragement — bonhomme seul
 * 1 – Les trois mots orbitent
 * 2 – ? silence visuel
 * 3 – ? → cube mélangé
 * 4 – Trois faces du cube visibles + labels
 */
export function S06_Reframing({ step }: SceneProps) {
  return (
    <SceneShell>
      <ChapterBadge chapter="Le reframing" beat="2/4" />
      <AnimatePresence mode="wait">

        {/* beat 30 */}
        {step === 0 && (
          <motion.div
            key="b30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Person size={52} />
          </motion.div>
        )}

        {/* beat 31 — orbite */}
        {step === 1 && (
          <motion.div
            key="b31"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex size-64 items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full border border-zinc-800/60" />
            {ORBIT_WORDS.map((word, i) => {
              const baseAngle = (i * 120 - 90) * (Math.PI / 180);
              return (
                <motion.span
                  key={word}
                  className="absolute left-1/2 top-1/2 whitespace-nowrap text-xs font-medium tracking-[0.22em] text-zinc-300 uppercase"
                  animate={{
                    x: [
                      Math.cos(baseAngle) * ORBIT_R,
                      Math.cos(baseAngle + Math.PI) * ORBIT_R,
                      Math.cos(baseAngle + 2 * Math.PI) * ORBIT_R,
                    ],
                    y: [
                      Math.sin(baseAngle) * ORBIT_R,
                      Math.sin(baseAngle + Math.PI) * ORBIT_R,
                      Math.sin(baseAngle + 2 * Math.PI) * ORBIT_R,
                    ],
                  }}
                  transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.div>
        )}

        {/* beat 32 — silence */}
        {step === 2 && (
          <motion.div
            key="b32"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.span
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-6xl font-thin text-zinc-500"
            >
              ?
            </motion.span>
          </motion.div>
        )}

        {/* beat 33 — ? → cube */}
        {step === 3 && (
          <motion.div
            key="b33"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <RubiksCube state="scrambled" size={80} spin={false} />
          </motion.div>
        )}

        {/* beat 34 — trois faces visibles */}
        {step === 4 && (
          <motion.div
            key="b34"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative flex size-64 items-center justify-center">
              <div className="absolute opacity-[0.12]">
                <RubiksCube state="scrambled" size={160} spin={false} />
              </div>
              <SceneLabel size="sm" animate={false}>VOLUME</SceneLabel>
              <div className="absolute top-4 right-4">
                <SceneLabel size="xs" muted animate={false}>QUALITÉ</SceneLabel>
              </div>
              <div className="absolute bottom-4 left-4">
                <SceneLabel size="xs" muted animate={false}>INTÉRÊT</SceneLabel>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
