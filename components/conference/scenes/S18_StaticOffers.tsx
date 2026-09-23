"use client";

import { AnimatePresence, motion } from "framer-motion";

import { ConferencePricingCards } from "@/components/conference/conference-pricing-cards";
import { useConferenceSaleWindow } from "@/components/conference/use-conference-sale-window";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";

/**
 * S18 — Offres statiques finales  (steps 0-1, beats 150-151)
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
          className="text-sm tracking-[0.18em] text-muted-foreground"
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

        <AnimatePresence mode="popLayout">
          {step === 1 ? (
            <motion.p
              key="inscription"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="text-xs tracking-[0.18em] text-muted-foreground uppercase"
            >
              {saleWindow.checkoutOpen ? "Inscription ouverte" : "Inscription fermée"}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </SceneShell>
  );
}
