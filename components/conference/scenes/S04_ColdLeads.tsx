"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterDoor } from "../shared/ChapterDoor";
import { PersonGroup } from "../shared/Person";
import { PhoneIcon } from "../shared/PhoneIcon";
import { SceneShell } from "../shared/SceneShell";

/**
 * S04 — Les leads froids  (steps 0-3)
 *
 * 0 – Cube + Fiche de lead
 * 1 – Personne n'a demandé
 * 2 – Appel → relance → relance
 * 3 – Fiche BUDGET✕ BESOIN✕ PROFIL✕
 */
export function S04_ColdLeads({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b19"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <ChapterDoor
              label="FICHE DE LEAD"
              icon={<PhoneIcon size={20} className="text-zinc-500" />}
            />
          </motion.div>
        )}

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

      </AnimatePresence>
    </SceneShell>
  );
}
