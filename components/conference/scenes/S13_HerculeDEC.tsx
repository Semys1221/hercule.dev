"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Counter }     from "../shared/Counter";
import { Person, PersonGroup } from "../shared/Person";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";
import { SceneTagCard, SceneTagGrid } from "../shared/SceneTagCard";

/**
 * S13 — Hercule DEC — Histoire  (steps 0-11, beats 85-96)
 *
 * 0  – Restaurant  (85)
 * 1  – Problème : CA / Marge / Rentabilité  (86)
 * 2  – CA monte, marges se contractent  (87)
 * 3  – Cabinet actuel → votre cabinet  (88)
 * 4  – Services : ratio / pilotage / coûts / renta  (89)
 * 5  – 300 €/mois  (90)
 * 6  – 10 restaurants  (91)
 * 7  – 3 signatures  (92)
 * 8  – 900 € MRR  (93)
 * 9  – 12 mois / 36 clients / 10 800 €  (94)
 * 10 – 129 600 €  (95)
 * 11 – Prix 1 499 € — 1 mois  (96)
 */
export function S13_HerculeDEC({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s13-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            {/* restaurant icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-20 text-zinc-300" aria-hidden>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" strokeLinecap="round" />
              <path d="M7 2v20M21 15V2a5 5 0 0 1-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Person size={40} icon="fork" />
            <SceneLabel size="sm" animate={false}>RESTAURANT</SceneLabel>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s13-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-16 text-zinc-400" aria-hidden>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" strokeLinecap="round" />
              <path d="M7 2v20M21 15V2a5 5 0 0 1-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex gap-6 font-mono text-base">
              {[{ label: "CA", ok: true }, { label: "MARGE", ok: false }, { label: "RENTABILITÉ", ok: false }].map(({ label, ok }, i) => (
                <motion.span key={label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
                  className={ok ? "text-zinc-300" : "text-zinc-600"}
                >
                  {label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s13-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: 2, duration: 0.9 }}
              className="text-4xl font-light text-zinc-300"
            >
              CA ↑
            </motion.div>
            <p className="text-base text-zinc-600">Marge ↓</p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s13-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-16"
          >
            <div className="flex flex-col items-center gap-2 opacity-35">
              <Person size={36} icon="fork" highlighted={false} />
              <SceneLabel size="xs" muted animate={false}>CABINET ACTUEL</SceneLabel>
            </div>
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-2"
            >
              <Person size={40} icon="fork" />
              <SceneLabel size="xs" animate={false}>VOTRE CABINET</SceneLabel>
            </motion.div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s13-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SceneTagGrid cols={2} className="gap-3">
              {["RATIO MATIÈRE", "PILOTAGE", "COÛTS", "RENTABILITÉ"].map((s, i) => (
                <motion.div key={s}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                >
                  <SceneTagCard className="border-zinc-700/50 px-4 py-3">
                    <SceneLabel size="xs" animate={false} className="tracking-[0.12em]">{s}</SceneLabel>
                  </SceneTagCard>
                </motion.div>
              ))}
            </SceneTagGrid>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s13-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Person size={40} icon="fork" />
            <motion.p
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-4xl font-light text-zinc-200"
            >
              300 € <span className="text-xl text-zinc-500">/ mois</span>
            </motion.p>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="s13-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-3 max-w-xs"
          >
            {Array.from({ length: 10 }, (_, i) => <Person key={i} size={28} icon="fork" delay={i * 0.06} />)}
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="s13-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-end gap-6"
          >
            <PersonGroup count={7} size={26} icon="fork" highlightCount={0} />
            <PersonGroup count={3} size={30} icon="fork" />
          </motion.div>
        )}

        {step === 8 && (
          <motion.div key="s13-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 font-mono"
          >
            <p className="text-base text-zinc-500">3 × 300 €</p>
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              className="h-px w-24 bg-zinc-700"
            />
            <p className="text-4xl font-thin text-zinc-200">
              <Counter to={900} /> € <span className="text-xl">/ mois</span>
            </p>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="s13-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-base text-zinc-500">12 mois · 36 clients</p>
            <p className="text-4xl font-thin text-zinc-200">
              <Counter to={10800} /> € <span className="text-xl">/ mois</span>
            </p>
          </motion.div>
        )}

        {step === 10 && (
          <motion.div key="s13-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-5xl font-thin text-zinc-200 tabular-nums">
              <Counter to={129600} duration={1.4} />
            </p>
            <SceneLabel size="sm" muted animate={false}>ANNUEL RÉCURRENT</SceneLabel>
          </motion.div>
        )}

        {step === 11 && (
          <motion.div key="s13-11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <p className="text-5xl font-thin text-zinc-200">1 499 €</p>
              <p className="mt-1 text-base text-zinc-500">— 1 mois</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
