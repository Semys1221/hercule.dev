"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Person, PersonGroup } from "../shared/Person";
import { RubiksCube }   from "../shared/RubiksCube";
import { SceneLabel }   from "../shared/SceneLabel";
import { SceneShell }   from "../shared/SceneShell";

/**
 * S03 — Problème du BAO  (steps 0-6, beats 12-18)
 *
 * 0 – Rupture brutale — ?
 * 1 – VOLUME ?
 * 2 – MOMENT ?
 * 3 – PROFIL ?
 * 4 – Particulier vs professionnel
 * 5 – Calendrier impossible
 * 6 – Cube mélangé — système incontrôlable
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
              className="text-7xl font-thin text-zinc-400"
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
              className="rounded border border-zinc-600/60 px-8 py-5 text-center"
            >
              <SceneLabel size="xl" animate={false}>VOLUME</SceneLabel>
              <p className="mt-2 text-3xl text-zinc-500">?</p>
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
              className="rounded border border-zinc-700/40 px-5 py-4 text-center"
            >
              <SceneLabel size="xs" muted animate={false}>VOLUME ?</SceneLabel>
            </motion.div>
            <div className="rounded border border-zinc-600/60 px-8 py-5 text-center">
              <SceneLabel size="xl" animate={false}>MOMENT</SceneLabel>
              <p className="mt-2 text-3xl text-zinc-500">?</p>
              {/* clock */}
              <motion.svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="mx-auto mt-3 size-7 text-zinc-600"
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
            <div className="rounded border border-zinc-600/60 px-8 py-5 text-center">
              <SceneLabel size="xl" animate={false}>PROFIL</SceneLabel>
              <p className="mt-2 text-3xl text-zinc-500">?</p>
            </div>
          </motion.div>
        )}

        {/* beat 16 — particulier ou pro */}
        {step === 4 && (
          <motion.div
            key="b16"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 7 }, (_, i) => (
                <Person
                  key={i}
                  size={24}
                  icon={i === 3 ? "briefcase" : "none"}
                  highlighted={i === 3}
                  delay={i * 0.04}
                />
              ))}
            </div>
            <svg viewBox="0 0 100 64" className="h-16 w-28 text-zinc-600" aria-hidden>
              <path
                d="M10 0 L90 0 L70 60 L30 60 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Person size={32} icon="briefcase" />
            </motion.div>
          </motion.div>
        )}

        {/* beat 17 — calendrier impossible */}
        {step === 5 && (
          <motion.div
            key="b17"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="grid grid-cols-5 gap-1">
              {["LUN","MAR","MER","JEU","VEN"].map((d) => (
                <div key={d} className="flex h-12 w-12 flex-col items-center justify-center
                  rounded border border-zinc-700/50 text-[10px] text-zinc-600">
                  {d}
                </div>
              ))}
            </div>
            <motion.p
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: 3, duration: 0.6 }}
              className="text-sm text-zinc-500"
            >
              10 PROFESSIONNELS → <span className="text-zinc-600">?</span>
            </motion.p>
          </motion.div>
        )}

        {/* beat 18 — système incontrôlable */}
        {step === 6 && (
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
