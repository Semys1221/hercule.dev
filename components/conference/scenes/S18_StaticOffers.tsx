"use client";

import { motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { SceneLabel } from "../shared/SceneLabel";
import { SceneShell } from "../shared/SceneShell";

/**
 * S18 — Offres statiques finales  (steps 0-1, beats 121-122)
 *
 * 0 – Transition depuis écran final
 * 1 – Les deux offres côte à côte — état STATIQUE permanent
 */
export function S18_StaticOffers({ step }: SceneProps) {
  return (
    <SceneShell>
      <div className="flex w-full max-w-3xl flex-col items-center gap-10 px-6">

        {/* Phrase résiduelle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.6 }}
          className="text-sm tracking-[0.18em] text-zinc-600"
        >
          LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT.
        </motion.p>

        {/* Cards */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">

          {/* DEC */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 rounded border border-zinc-700/60 bg-zinc-900/50 px-8 py-10"
          >
            <SceneLabel size="md" animate={false}>HERCULE DEC</SceneLabel>
            <p className="text-4xl font-thin text-zinc-200">1 499 €</p>
            <p className="text-sm text-zinc-500">/ mois</p>
            <div className="mt-2 h-px w-full bg-zinc-800" />
            <ul className="space-y-1 text-xs tracking-widest text-zinc-600 uppercase">
              <li>10 restaurants / mois</li>
              <li>3 signatures visées</li>
              <li>Rétractation 4 jours</li>
            </ul>
          </motion.div>

          {/* Courtage */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 rounded border border-zinc-700/60 bg-zinc-900/50 px-8 py-10"
          >
            <SceneLabel size="md" animate={false}>HERCULE COURTAGE</SceneLabel>
            <p className="text-4xl font-thin text-zinc-200">3 900 €</p>
            <p className="text-sm text-zinc-500">/ 3 mois</p>
            <p className="text-xl text-zinc-400">1 800 € / mois</p>
            <div className="mt-2 h-px w-full bg-zinc-800" />
            <ul className="space-y-1 text-xs tracking-widest text-zinc-600 uppercase">
              <li>25 médecins qualifiés</li>
              <li>9 signatures visées</li>
              <li>Rétractation 4 jours</li>
            </ul>
          </motion.div>

        </div>
      </div>
    </SceneShell>
  );
}
