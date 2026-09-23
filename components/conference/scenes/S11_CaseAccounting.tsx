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
const MONTHS = ["Mois 1", "Mois 2", "Mois 3"] as const;

export function S11_CaseAccounting({ step }: SceneProps) {
  const copy = CASE_STUDIES.featured.accounting;
  const metrics = CASE_STUDIES.metrics.accounting;
  const firm = firmBySlug(copy.slug);
  const max = Math.max(...metrics.monthProfiles);

  return (
    <SceneShell>
      <AnimatePresence mode="wait">
        {step < CASE_FIGURES_STEP && (
          <CaseNarrative
            key="accounting-story"
            firm={firm}
            activity="Expertise comptable"
            copy={copy}
            reveal={step as 0 | 1 | 2 | 3}
          />
        )}
        {step === CASE_FIGURES_STEP && (
          <motion.div
            key="accounting-figures"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex w-[42rem] max-w-full flex-col items-center gap-10"
          >
            <div className="grid w-full grid-cols-3 items-end gap-8">
              {metrics.monthProfiles.map((count, index) => (
                <motion.div
                  key={MONTHS[index]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.45, ease: EASE }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-3xl font-medium tabular-nums text-foreground">{count}</p>
                  <div className="flex h-24 w-full items-end justify-center">
                    <motion.div
                      className="w-10 origin-bottom rounded-t bg-foreground"
                      style={{ height: `${Math.round((count / max) * 100)}%` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.12 + index * 0.08, duration: 0.55, ease: EASE }}
                    />
                  </div>
                  <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {MONTHS[index]}
                  </p>
                  <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">Profils</p>
                </motion.div>
              ))}
            </div>
            <div className="grid w-full grid-cols-3 gap-6">
              <ProofFigure
                value={`${metrics.conversionPct} %`}
                label="Conversion"
                delay={0.28}
                compact
              />
              <ProofFigure
                value={`${metrics.ticketMinEur}–${metrics.ticketMaxEur} €`}
                label="Panier moyen"
                delay={0.36}
                compact
              />
              <ProofFigure
                value={formatEur(metrics.cumulativeRevenueEur)}
                label="CA cumulé / 3 mois"
                delay={0.44}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
