"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

function Countdown() {
  const [secs, setSecs] = useState(300);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return (
    <p className="font-mono text-7xl font-thin tabular-nums tracking-widest text-zinc-200">
      {m}:{s}
    </p>
  );
}

/**
 * S16 — Urgence  (steps 0-1, beats 115-116)
 *
 * 0 – Lien Stripe
 * 1 – Countdown 5:00
 */
export function S16_Urgency({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s16-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="rounded border border-zinc-700/60 px-6 py-4 text-sm text-zinc-500">
              Paiement
            </div>
            <p className="text-2xl tracking-[0.3em] text-zinc-300 uppercase">STRIPE</p>
            <motion.div
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ duration: 0.5 }}
              className="h-14 w-px origin-top bg-zinc-700"
            />
            <p className="text-[10px] tracking-widest text-zinc-600">↓ dans le chat</p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s16-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Countdown />
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
