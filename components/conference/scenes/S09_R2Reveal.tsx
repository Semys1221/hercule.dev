"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { CourtageTagline } from "../shared/CourtageTagline";
import { PersonGroup } from "../shared/Person";
import { QualificationBoard } from "./QualificationBoard";
import {
  S09_COURTAGE_STEP,
  S09_LOGO_STEP,
  S09_QUAL_END,
  S09_QUAL_START,
} from "./s09-qualification";
import { PhoneIcon }   from "../shared/PhoneIcon";
import { RubiksCube }  from "../shared/RubiksCube";
import { QualificationChecklist } from "../shared/QualificationChecklist";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";
import { R2Lockup } from "../shared/R2Lockup";
import { SilverHerculeMark } from "../shared/SilverHerculeMark";
import { StageSubtitle } from "../shared/StageSubtitle";

const TARGETS = ["BNC", "BIC", "TNS"] as const;

const LITE_FILTERS = [
  {
    niche: "DEC",
    items: [
      { label: "Restaurant solvable" },
      { label: "Besoin de pilotage" },
    ],
  },
  {
    niche: "IAS",
    items: [
      { label: "Trésorerie ≥ 50 k€" },
      { label: "Risque assurable" },
    ],
  },
  {
    niche: "CIF",
    items: [
      { label: "Trésorerie ≥ 50 k€" },
      { label: "Leviers" },
    ],
  },
] as const;

function ThemeTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-4xl font-medium tracking-[0.18em] text-foreground uppercase">
        {title}
      </p>
      <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * S09 — Révélation HERCULE R2  (steps 0-36)
 */
export function S09_R2Reveal({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-6"
          >
            <div
              className="relative flex items-center justify-center"
              style={{ width: 160, height: 160, perspective: 900 }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 1, scale: 1, rotateY: 0 }}
                animate={{ opacity: 0, scale: 0.85, rotateY: 70 }}
                transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <RubiksCube state="solved" size={88} spin />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.15, rotateY: -80, z: -40 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 180, damping: 18 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <SilverHerculeMark className="size-28" />
              </motion.div>
            </div>
            <StageSubtitle>Une solution qui résout ce vrai problème.</StageSubtitle>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="b41"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            data-stage-bare=""
            className="flex flex-col items-center gap-8"
          >
            <R2Lockup />
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              Volume · Qualification · Intérêt
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="b42"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <ThemeTitle title="Construire une audience" subtitle="Étape 1 — Volume" />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="b43"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <ThemeTitle title="Construire une audience" subtitle="Étape 1 — Volume" />
            <PersonGroup count={20} icon="briefcase" size={24} />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="b44"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <ThemeTitle title="Construire une audience" subtitle="Étape 1 — Volume" />
            <div className="flex gap-4">
              {TARGETS.map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="rounded border border-border px-6 py-4"
                >
                  <SceneLabel size="sm" animate={false}>{label}</SceneLabel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="b45"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <ThemeTitle title="Construire une audience" subtitle="Étape 1 — Volume" />
            <PersonGroup count={20} icon="briefcase" size={24} />
            <p className="max-w-md text-center text-sm tracking-[0.12em] text-muted-foreground">
              On construit le volume. Pas encore le filtre.
            </p>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="b46"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <ThemeTitle title="Le filtre" subtitle="Étape 2 — Qualification" />
          </motion.div>
        )}

        {step === 7 && (
          <motion.div
            key="b47"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex items-center justify-center"
          >
            <PhoneIcon size={48} className="text-muted-foreground" />
          </motion.div>
        )}

        {step === 8 && (
          <motion.div
            key="b48"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <SceneLabel size="md" animate={false}>Le filtre</SceneLabel>
            <div className="flex flex-col items-start gap-5">
              {LITE_FILTERS.map((row, index) => (
                <QualificationChecklist
                  key={row.niche}
                  layout="compact"
                  niche={row.niche}
                  items={[...row.items]}
                  delay={0.2 + index * 0.9}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step >= S09_QUAL_START && step <= S09_QUAL_END && (
          <motion.div
            key="qualification-board"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <QualificationBoard step={step} />
          </motion.div>
        )}

        {(step === S09_LOGO_STEP || step === S09_COURTAGE_STEP) && (
          <motion.div
            key="r2-lockup"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            data-stage-bare=""
            className="flex flex-col items-center gap-10"
          >
            <R2Lockup />
            {step === S09_COURTAGE_STEP ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <CourtageTagline />
              </motion.div>
            ) : null}
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
