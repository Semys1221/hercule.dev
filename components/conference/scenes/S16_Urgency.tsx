"use client";

import { motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

/**
 * S16 — Urgence  (step 0, beat 115)
 *
 * 0 – Lien Stripe
 */
export function S16_Urgency(_props: SceneProps) {
  return (
    <SceneShell>
      <motion.div
        key="s16-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="rounded border border-zinc-700/60 px-6 py-4 text-sm text-zinc-500">
          Paiement
        </div>
        <p className="text-2xl tracking-[0.3em] text-zinc-300 uppercase">Paiement sécurisé</p>
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 0.5 }}
          className="h-14 w-px origin-top bg-zinc-700"
        />
        <p className="text-[10px] tracking-widest text-zinc-600">Lien dans le chat</p>
      </motion.div>
    </SceneShell>
  );
}
