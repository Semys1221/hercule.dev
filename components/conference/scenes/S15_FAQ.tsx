"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

const ITEMS = [
  "QUESTIONS ?",
  "Les prospects sont-ils dans ma région ?",
  "Puis-je payer au mois ?",
  "Est-ce que le client voit mon entreprise ?",
  "Est-ce que vous appelez les prospects ?",
];

/**
 * S15 — FAQ  (steps 0-4, beats 110-114)
 * Extremely minimal: one question at a time, presenter answers orally.
 */
export function S15_FAQ({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={`faq-${step}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg px-10 text-center"
        >
          <p className={`leading-relaxed ${step === 0 ? "text-3xl font-light tracking-[0.28em] uppercase text-zinc-400" : "text-2xl font-light text-zinc-300"}`}>
            {ITEMS[step]}
          </p>
        </motion.div>
      </AnimatePresence>
    </SceneShell>
  );
}
