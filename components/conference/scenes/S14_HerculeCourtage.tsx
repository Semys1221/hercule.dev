"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Counter }     from "../shared/Counter";
import { HerculeLogo } from "../shared/HerculeLogo";
import { Person, PersonGroup } from "../shared/Person";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S14 — Hercule Courtage — Histoire  (steps 0-12, beats 97-109)
 *
 * 0  – Médecin arrive  (97)
 * 1  – Profil collectif  (98)
 * 2  – Pression fiscale  (99)
 * 3  – Cartes dispersées  (100)
 * 4  – Architecture qui s'assemble  (101)
 * 5  – Solutions : PER / lombard / SCPI / IFC…  (102)
 * 6  – 50 000 €  (103)
 * 7  – 2 500 € commission  (104)
 * 8  – 25 profils en 3 mois  (105)
 * 9  – 9 signatures / 22 500 €  (106)
 * 10 – 450 000 € encours  (107)
 * 11 – Prix 3 900 € / 3 mois  (108)
 * 12 – Rétractation 4 jours  (109)
 */
export function S14_HerculeCourtage({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s14-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {/* stethoscope icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-20 text-zinc-300" aria-hidden>
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" strokeLinecap="round" />
              <path d="M8 15v1a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6v-4" strokeLinecap="round" />
              <circle cx="20" cy="10" r="2" />
            </svg>
            <SceneLabel size="lg" animate={false}>HERCULE COURTAGE</SceneLabel>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s14-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PersonGroup count={6} icon="stethoscope" size={30} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s14-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <Person size={44} icon="stethoscope" />
            <div className="space-y-1 text-base font-mono">
              <p className="text-zinc-300">REVENUS</p>
              <div className="h-px bg-zinc-700 w-full" />
              <motion.p
                animate={{ color: ["#71717a", "#ef4444", "#71717a"] }}
                transition={{ repeat: 2, duration: 0.8 }}
                className="text-zinc-500"
              >
                IMPÔTS ↑
              </motion.p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s14-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex size-56 items-center justify-center"
          >
            <Person size={36} icon="stethoscope" className="absolute" />
            {["RETRAITE", "PATRIMOINE", "PRÉVOYANCE", "FINANCEMENT"].map((label, i) => {
              const angle = i * 90;
              return (
                <motion.span key={label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
                  className="absolute text-xs tracking-widest text-zinc-600 uppercase"
                  style={{ transform: `rotate(${angle}deg) translateY(-76px) rotate(${-angle}deg)` }}
                >
                  {label}
                </motion.span>
              );
            })}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s14-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            {/* cards assembling into architecture */}
            <div className="flex gap-2">
              {["RETRAITE", "PATRIMOINE"].map((s, i) => (
                <motion.div key={s}
                  initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded border border-zinc-700/50 px-3 py-2"
                >
                  <SceneLabel size="xs" animate={false}>{s}</SceneLabel>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2">
              {["PRÉVOYANCE", "FINANCEMENT"].map((s, i) => (
                <motion.div key={s}
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded border border-zinc-600/60 px-3 py-2"
                >
                  <SceneLabel size="xs" animate={false}>{s}</SceneLabel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s14-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {["PER", "LOMBARD", "SCPI", "IFC", "PRÉVOYANCE", "ASSURANCE"].map((s, i) => (
              <motion.div key={s}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="rounded border border-zinc-800/70 px-2 py-1.5 text-center"
              >
                <SceneLabel size="xs" muted animate={false}>{s}</SceneLabel>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="s14-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Person size={44} icon="stethoscope" />
            <p className="text-4xl font-thin text-zinc-200">50 000 €</p>
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="s14-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 font-mono"
          >
            <p className="text-base text-zinc-500">50 000 €</p>
            <div className="h-px w-20 bg-zinc-700" />
            <p className="text-4xl font-thin text-zinc-200">2 500 €</p>
            <SceneLabel size="xs" muted animate={false}>COMMISSION</SceneLabel>
          </motion.div>
        )}

        {step === 8 && (
          <motion.div key="s14-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <PersonGroup count={10} icon="stethoscope" size={26} />
            <SceneLabel size="md" animate={false}>25 PROFILS QUALIFIÉS</SceneLabel>
            <p className="text-sm text-zinc-600">3 mois</p>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="s14-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex gap-1">
              {Array.from({ length: 9 }, (_, i) => (
                <Person key={i} size={22} icon="stethoscope" delay={i * 0.06} />
              ))}
            </div>
            <p className="text-4xl font-thin text-zinc-200">
              <Counter to={22500} duration={1.2} /> €
            </p>
          </motion.div>
        )}

        {step === 10 && (
          <motion.div key="s14-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-5xl font-thin text-zinc-200 tabular-nums">
              <Counter to={450000} duration={1.4} />
            </p>
            <SceneLabel size="sm" muted animate={false}>ENCOURS</SceneLabel>
          </motion.div>
        )}

        {step === 11 && (
          <motion.div key="s14-11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <HerculeLogo size="md" showName />
            <p className="text-4xl font-thin text-zinc-200">3 900 €</p>
            <p className="text-base text-zinc-500">/ 3 mois</p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-xl text-zinc-400"
            >
              1 800 € <span className="text-base text-zinc-600">/ mois</span>
            </motion.p>
          </motion.div>
        )}

        {step === 12 && (
          <motion.div key="s14-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2, type: "spring" }}
                  className="flex h-10 w-10 items-center justify-center rounded border border-zinc-600/60 bg-zinc-800/60 text-xs text-zinc-300"
                >
                  {i + 1}
                </motion.div>
              ))}
            </div>
            <SceneLabel size="xs" muted animate={false}>RÉTRACTATION 4 JOURS</SceneLabel>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
