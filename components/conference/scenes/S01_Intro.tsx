"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { TEAM_IMAGE_URL } from "@/lib/constants";
import type { SceneProps } from "../presentation/types";
import { Person, PersonGroup } from "../shared/Person";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S01 — Introduction  (steps 0-2)
 *
 * 0 – Carte vide
 * 1 – Trois marchés
 * 2 – Evan / HERCULE.DEV
 */
export function S01_Intro({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b01"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
        )}

        {step === 1 && (
          <motion.div
            key="b04"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-6"
          >
            {(["COMPTABILITÉ", "COURTAGE FINANCIER", "ASSURANCE"] as const).map(
              (label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  className="flex flex-col items-center gap-3 rounded border border-zinc-700/50 px-5 py-4"
                >
                  <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
                  <PersonGroup count={3} icon="briefcase" size={24} />
                </motion.div>
              ),
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="b06"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative size-24 overflow-hidden rounded-full border border-zinc-700">
              <Image
                src={TEAM_IMAGE_URL}
                alt="Evan — Fondateur Hercule"
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <SceneLabel size="lg" animate={false}>HERCULE.DEV</SceneLabel>
            <p className="text-sm text-zinc-700">Fondateur</p>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
