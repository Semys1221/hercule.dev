"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { RubiksCube }  from "../shared/RubiksCube";
import { Person }      from "../shared/Person";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S02 — Le bouche-à-oreille  (steps 0-3, beats 8-11)
 *
 * 0 – Cube mélangé → déplacement + carte BAO
 * 1 – Deux personnes reliées (confiance)
 * 2 – 5-6 profils, cœur qui pulse
 * 3 – Bulle + ✓ clôture
 */
export function S02_WordOfMouth({ step }: SceneProps) {
  return (
    <SceneShell>
      <ChapterBadge chapter="Le problème" beat="1/4" />
      <AnimatePresence mode="wait">

        {/* beat 8 — nouveau chapitre */}
        {step === 0 && (
          <motion.div
            key="b08"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-14"
          >
            <RubiksCube state="scrambled" size={72} spin={false} />
            <div className="flex flex-col gap-2 rounded border border-zinc-700/50 px-6 py-4">
              {/* ear icon SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="size-5 text-zinc-500 mb-1" aria-hidden>
                <path d="M6 12a6 6 0 1 1 12 0c0 3.5-2.5 6-6 6h-1" strokeLinecap="round" />
                <path d="M10 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0" strokeLinecap="round" />
              </svg>
              <SceneLabel size="sm" animate={false}>BOUCHE-À-OREILLE</SceneLabel>
            </div>
          </motion.div>
        )}

        {/* beat 9 — confiance */}
        {step === 1 && (
          <motion.div
            key="b09"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-10"
          >
            <Person size={44} />
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="h-px bg-zinc-600"
                initial={{ width: 0 }} animate={{ width: 80 }}
                transition={{ duration: 0.6 }}
              />
              {/* pulse dot */}
              <motion.div
                className="size-1.5 rounded-full bg-zinc-500"
                animate={{ x: [0, 80, 0] }}
                transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }}
              />
            </div>
            <Person size={44} delay={0.2} />
          </motion.div>
        )}

        {/* beat 10 — profils + cœur */}
        {step === 2 && (
          <motion.div
            key="b10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-8 text-zinc-400"
              aria-hidden
              animate={{ scale: [1, 1.25, 1], opacity: [0, 1, 0.85] }}
              transition={{ duration: 0.7 }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
            </motion.svg>
            <div className="flex gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Person key={i} size={30} delay={i * 0.06} />
              ))}
            </div>
          </motion.div>
        )}

        {/* beat 11 — discussion / ✓ */}
        {step === 3 && (
          <motion.div
            key="b11"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-8">
              <Person size={40} />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded border border-zinc-600/50 px-3 py-2 text-xs text-zinc-500"
              >
                · · ·
              </motion.div>
              <Person size={40} delay={0.1} />
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl text-zinc-300"
            >
              ✓
            </motion.span>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
