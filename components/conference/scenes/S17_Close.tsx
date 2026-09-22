"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S17 — Close  (steps 0-3, beats 123-126)
 *
 * 0 – ZOOM / CHAT / PRIX disparaissent (beat 123)
 * 1 – Places limitées (beat 124)
 * 2 – LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT. (beat 125)
 * 3 – Cube discret (beat 126)
 */
export function S17_Close({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="popLayout">

        {step === 0 && (
          <motion.div key="s17-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {["Présentation", "Questions", "Tarifs"].map((label, i) => (
              <motion.p key={label}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: i * 0.5, duration: 0.4 }}
                className="text-lg tracking-[0.28em] text-zinc-400 uppercase"
              >
                {label}
              </motion.p>
            ))}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s17-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-wrap justify-center gap-2 max-w-xs"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`h-9 w-9 border ${i < 9 ? "border-zinc-600/60 bg-zinc-800/50" : "border-zinc-800/40"}`}
              />
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s17-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="max-w-xl px-8 text-center"
          >
            <p className="text-xl font-light leading-relaxed tracking-[0.12em] text-zinc-200 md:text-2xl">
              Les décisions qui façonne l&apos;avenir
              <br />
              sont prise aujourd&apos;hui
            </p>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s17-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-10"
          >
            {/* cube ghost */}
            <div className="absolute opacity-[0.06]">
              <RubiksCube state="solved" size={200} spin />
            </div>
            <p className="text-base tracking-[0.14em] text-zinc-500">
              Les décisions qui façonne l&apos;avenir sont prise aujourd&apos;hui
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
