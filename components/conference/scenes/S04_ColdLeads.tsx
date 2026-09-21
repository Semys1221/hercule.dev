"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Person, PersonGroup } from "../shared/Person";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S04 — Les leads froids  (steps 0-4, beats 19-23)
 *
 * 0 – Grande liste verticale + téléphone
 * 1 – Personne n'a demandé
 * 2 – Appel → relance → relance
 * 3 – Fiche BUDGET✕ BESOIN✕ PROFIL✕
 * 4 – 1 conversation = 0 €
 */
export function S04_ColdLeads({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {/* beat 19 — liste */}
        {step === 0 && (
          <motion.div
            key="b19"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-10"
          >
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 14 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-[10px] text-zinc-600">○</span>
                  <div className="h-px w-28 bg-zinc-800" />
                </motion.div>
              ))}
            </div>
            {/* phone */}
            <motion.svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="mt-4 size-10 text-zinc-400" aria-hidden
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6
                19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72
                12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91
                a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
                12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
                strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </motion.div>
        )}

        {/* beat 20 — personne n'a demandé */}
        {step === 1 && (
          <motion.div
            key="b20"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <PersonGroup count={8} size={28} />
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-sm text-zinc-600 tracking-widest uppercase"
            >
              Personne n&apos;a demandé à vous parler
            </motion.p>
          </motion.div>
        )}

        {/* beat 21 — appel / relances */}
        {step === 2 && (
          <motion.div
            key="b21"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {["APPEL", "RELANCE", "RELANCE"].map((label, i) => (
              <motion.div
                key={`${label}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.3 }}
                className="text-sm tracking-[0.22em] text-zinc-400 uppercase"
              >
                {label}
                {i < 2 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.3 + 0.15, duration: 0.2 }}
                    className="mx-auto mt-1 mb-1 h-4 w-px origin-top bg-zinc-700"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* beat 22 — mauvais profil */}
        {step === 3 && (
          <motion.div
            key="b22"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded border border-zinc-700/60 px-8 py-6 font-mono text-sm"
          >
            {[
              { label: "BUDGET", ok: false },
              { label: "BESOIN", ok: false },
              { label: "PROFIL", ok: false },
            ].map(({ label, ok }, i) => (
              <motion.p
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="mb-2 flex gap-4"
              >
                <span className="w-20 text-zinc-500">{label}</span>
                <span className={ok ? "text-zinc-300" : "text-zinc-600"}>✕</span>
              </motion.p>
            ))}
          </motion.div>
        )}

        {/* beat 23 — conversation achetée */}
        {step === 4 && (
          <motion.div
            key="b23"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-12 text-zinc-600" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3
                a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91
                a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7
                A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <motion.p
              animate={{ opacity: [1, 0] }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-sm text-zinc-500 tracking-widest uppercase"
            >
              1 conversation = 0 €
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
