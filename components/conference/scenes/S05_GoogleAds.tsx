"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { Person, PersonGroup } from "../shared/Person";
import { PhoneIcon } from "../shared/PhoneIcon";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S05 — Google Ads / SEO  (steps 0-5, beats 24-29)
 *
 * 0 – Le mouvement s'inverse
 * 1 – Téléphone sonne (lignes lumineuses)
 * 2 – Silhouettes entrent — profils variés
 * 3 – Filtre saturé
 * 4 – Grand entonnoir
 * 5 – 50 000 € ?
 */
export function S05_GoogleAds({ step }: SceneProps) {
  return (
    <SceneShell>
      <ChapterBadge chapter="Le problème" beat="4/4" />
      <AnimatePresence mode="wait">

        {/* beat 24 — inversion */}
        {step === 0 && (
          <motion.div
            key="b24"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-6"
          >
            <motion.div
              initial={{ x: 80 }} animate={{ x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-2"
            >
              {Array.from({ length: 6 }, (_, i) => <Person key={i} size={26} delay={i * 0.05} />)}
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-2xl text-zinc-400"
            >
              →
            </motion.span>
            <PhoneIcon size={32} className="text-zinc-400" />
          </motion.div>
        )}

        {/* beat 25 — téléphone sonne */}
        {step === 1 && (
          <motion.div
            key="b25"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex items-center justify-center"
          >
            {Array.from({ length: 5 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-zinc-600/40"
                style={{ width: 60 + i * 28, height: 60 + i * 28 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.1, 1.3] }}
                transition={{ duration: 1.4, delay: i * 0.28, repeat: Infinity, repeatDelay: 0.4 }}
              />
            ))}
            <PhoneIcon size={40} className="z-10 text-zinc-300" />
          </motion.div>
        )}

        {/* beat 26 — qui entre ? */}
        {step === 2 && (
          <motion.div
            key="b26"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* entrance door */}
            <div className="h-16 w-14 rounded-t border border-zinc-600/50 border-b-0" />
            <div className="flex flex-wrap justify-center gap-2">
              {(["PROFESSIONNEL", "PARTICULIER", "CURIEUX", "SANS BUDGET"] as const).map(
                (label, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.35, duration: 0.4 }}
                    className="text-[10px] tracking-widest text-zinc-400 uppercase"
                  >
                    {label}
                  </motion.span>
                ),
              )}
            </div>
          </motion.div>
        )}

        {/* beat 27 — filtre */}
        {step === 3 && (
          <motion.div
            key="b27"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <PersonGroup count={16} size={40} />
            <div className="flex h-6 w-48 items-center justify-center border border-zinc-700/50 bg-zinc-900/60">
              <span className="text-[9px] tracking-widest text-zinc-600 uppercase">Filtre</span>
            </div>
            <PersonGroup count={3} size={48} />
          </motion.div>
        )}

        {/* beat 28 — entonnoir */}
        {step === 4 && (
          <motion.div
            key="b28"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <PersonGroup count={20} size={40} />
            {/* funnel shape */}
            <svg viewBox="0 0 120 80" className="h-20 w-40 text-zinc-700" aria-hidden>
              <path d="M10 0 L110 0 L80 80 L40 80 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <PersonGroup count={2} size={52} />
          </motion.div>
        )}

        {/* beat 29 — BNC 50k€ */}
        {step === 5 && (
          <motion.div
            key="b29"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Person size={52} icon="briefcase" />
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="text-2xl font-light text-zinc-300"
            >
              50 000 € <span className="text-zinc-600">?</span>
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
