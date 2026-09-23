"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CASE_FIGURES_STEP,
  CASE_STUDIES,
  firmBySlug,
  formatEur,
} from "@/lib/conference/case-studies";
import type { SceneProps } from "../presentation/types";
import { SceneShell } from "../shared/SceneShell";
import { CaseNarrative, ProofFigure } from "./case-proof";

const EASE = [0.22, 1, 0.36, 1] as const;

export function S11_CaseBrokerage({ step }: SceneProps) {
  const copy = CASE_STUDIES.featured.brokerage;
  const metrics = CASE_STUDIES.metrics.brokerage;
  const firm = firmBySlug(copy.slug);

  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        {step < CASE_FIGURES_STEP && (
          <CaseNarrative
            key="brokerage-story"
            firm={firm}
            activity="IAS · CIF"
            copy={copy}
            reveal={step as 0 | 1 | 2 | 3}
          />
        )}
        {step === CASE_FIGURES_STEP && (
          <motion.div
            key="brokerage-figures"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex w-[40rem] max-w-full flex-col items-center gap-10"
          >
            <div className="grid w-full grid-cols-2 gap-x-16 gap-y-10">
              <ProofFigure value={String(metrics.days)} label="Jours" />
              <ProofFigure value={String(metrics.profiles)} label="Profils" delay={0.08} />
              <ProofFigure value={`${metrics.conversionPct} %`} label="Conversion" delay={0.16} />
              <ProofFigure
                value={formatEur(metrics.avgBasketEur)}
                label="Panier moyen / profil"
                delay={0.24}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36, duration: 0.4, ease: EASE }}
              className="max-w-md text-center text-sm leading-relaxed text-muted-foreground"
            >
              {copy.resultLine}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
