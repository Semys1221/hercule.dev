"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
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
        {step === 0 && (
          <CaseNarrative
            key="brokerage-story"
            firm={firm}
            activity="IAS · CIF"
            copy={copy}
          />
        )}
        {step === 1 && (
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
              <ProofFigure value={String(metrics.meetings)} label="Rendez-vous" delay={0.08} />
              <ProofFigure value={`${metrics.conversionPct} %`} label="Conversion" delay={0.16} />
              <ProofFigure
                value={formatEur(metrics.avgRevenueEur)}
                label="CA moyen / profil"
                delay={0.24}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.36, duration: 0.4, ease: EASE }}
              className="max-w-md text-center text-sm leading-relaxed text-zinc-400"
            >
              {copy.resultLine}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
