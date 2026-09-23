"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { PersonGroup } from "../shared/Person";
import { RubiksCube }   from "../shared/RubiksCube";
import { SceneLabel }   from "../shared/SceneLabel";
import { SceneShell }   from "../shared/SceneShell";

/**
 * S03 — Problème du BAO  (steps 0-4)
 *
 * 0 – Rupture brutale — ?
 * 1 – VOLUME ?
 * 2 – MOMENT ?
 * 3 – PROFIL ?
 * 4 – Cube mélangé — système incontrôlable
 */
export function S03_WOMProblem({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {/* beat 12 — rupture */}
        {step === 0 && (
          <motion.div
            key="b12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="flex items-center justify-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-7xl font-thin text-muted-foreground"
            >
              ?
            </motion.span>
          </motion.div>
        )}

        {/* beat 13 — VOLUME */}
        {step === 1 && (
          <motion.div
            key="b13"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ x: [0, 3, -3, 0] }}
              transition={{ repeat: 3, duration: 0.25 }}
              className="rounded border border-border px-8 py-5 text-center"
            >
              <SceneLabel size="xl" animate={false}>VOLUME</SceneLabel>
              <p className="mt-2 text-3xl text-muted-foreground">?</p>
            </motion.div>
            <PersonGroup count={6} size={24} />
          </motion.div>
        )}

        {/* beat 14 — MOMENT */}
        {step === 2 && (
          <motion.div
            key="b14"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-5"
          >
            <motion.div
              initial={{ x: 0 }} animate={{ x: -30, opacity: 0.3 }}
              transition={{ duration: 0.5 }}
              className="rounded border border-border px-5 py-4 text-center"
            >
              <SceneLabel size="xs" muted animate={false}>VOLUME ?</SceneLabel>
            </motion.div>
            <div className="rounded border border-border px-8 py-5 text-center">
              <SceneLabel size="xl" animate={false}>MOMENT</SceneLabel>
              <p className="mt-2 text-3xl text-muted-foreground">?</p>
              {/* clock */}
              <motion.svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="mx-auto mt-3 size-7 text-muted-foreground"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: 2, ease: "linear" }}
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" />
              </motion.svg>
            </div>
          </motion.div>
        )}

        {/* beat 15 — PROFIL */}
        {step === 3 && (
          <motion.div
            key="b15"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-5"
          >
            <div className="flex flex-col gap-2 opacity-25">
              <SceneLabel size="xs" muted animate={false}>VOLUME ?</SceneLabel>
              <SceneLabel size="xs" muted animate={false}>MOMENT ?</SceneLabel>
            </div>
            <div className="rounded border border-border px-8 py-5 text-center">
              <SceneLabel size="xl" animate={false}>PROFIL</SceneLabel>
              <p className="mt-2 text-3xl text-muted-foreground">?</p>
            </div>
          </motion.div>
        )}

        {/* cube mélangé — système incontrôlable */}
        {step === 4 && (
          <motion.div
            key="b18"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <RubiksCube state="scrambled" size={72} spin={false} />
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
