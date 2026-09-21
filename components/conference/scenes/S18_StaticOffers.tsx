"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ConferencePricingCards } from "@/components/conference/conference-pricing-cards";
import type { SceneProps } from "../presentation/types";
import { Countdown } from "../shared/Countdown";
import { HerculeLogo } from "../shared/HerculeLogo";
import { SceneShell } from "../shared/SceneShell";

/**
 * S18 — Offres statiques finales  (steps 0-1, beats 127-128)
 *
 * 0 – Logo + deux cartes pricing
 * 1 – Même écran + countdown sous les cartes
 */
export function S18_StaticOffers({ step }: SceneProps) {
  return (
    <SceneShell>
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6">
        <HerculeLogo size="md" showName />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.6 }}
          className="text-sm tracking-[0.18em] text-zinc-600"
        >
          LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <ConferencePricingCards variant="static" />
        </motion.div>

        <AnimatePresence>
          {step === 1 && (
            <motion.div
              key="s18-countdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center gap-2 pt-2"
            >
              <Countdown />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SceneShell>
  );
}
