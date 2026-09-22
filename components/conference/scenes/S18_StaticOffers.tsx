"use client";

import { motion } from "framer-motion";

import { ConferencePricingCards } from "@/components/conference/conference-pricing-cards";
import { useConferenceSaleWindow } from "@/components/conference/use-conference-sale-window";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

/**
 * S18 — Offres statiques finales  (steps 0-1, beats 127-128)
 */
export function S18_StaticOffers({ step }: SceneProps) {
  const saleWindow = useConferenceSaleWindow({ poll: true });

  return (
    <SceneShell>
      <div className="flex w-[min(56rem,calc(100vw-4rem))] flex-col items-center justify-center gap-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.6 }}
          className="text-sm tracking-[0.18em] text-zinc-600"
        >
          Les décisions qui façonne l&apos;avenir sont prise aujourd&apos;hui
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <ConferencePricingCards
            variant="static"
            checkoutOpen={saleWindow.checkoutOpen}
          />
        </motion.div>

        {step === 1 ? (
          <p className="text-xs tracking-[0.18em] text-zinc-500 uppercase">
            {saleWindow.checkoutOpen ? "Inscription ouverte" : "Inscription fermée"}
          </p>
        ) : null}
      </div>
    </SceneShell>
  );
}
