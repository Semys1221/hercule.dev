"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import type { SceneProps } from "../presentation/types";
import { ChapterDoor } from "../shared/ChapterDoor";
import { PersonGroup } from "../shared/Person";
import { PhoneIcon } from "../shared/PhoneIcon";
import { SceneShell } from "../shared/SceneShell";

/**
 * S05 — Google Ads / SEO  (steps 0-3)
 *
 * 0 – Cube + Google Ads
 * 1 – Téléphone sonne (lignes lumineuses)
 * 2 – Silhouettes entrent — profils variés
 * 3 – Grand entonnoir
 */
export function S05_GoogleAds({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b24"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <ChapterDoor
              label="GOOGLE ADS"
              icon={<Megaphone className="mb-1 size-5 text-zinc-500" aria-hidden />}
            />
          </motion.div>
        )}

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

        {step === 2 && (
          <motion.div
            key="b26"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
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

        {step === 3 && (
          <motion.div
            key="b28"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <PersonGroup count={20} size={40} />
            <svg viewBox="0 0 120 80" className="h-20 w-40 text-zinc-700" aria-hidden>
              <path d="M10 0 L110 0 L80 80 L40 80 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <PersonGroup count={2} size={52} />
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
