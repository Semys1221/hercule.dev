"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { FlowLine }    from "../shared/FlowLine";
import { HerculeLogo } from "../shared/HerculeLogo";
import { Person, PersonGroup } from "../shared/Person";
import { PhoneIcon }   from "../shared/PhoneIcon";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

const TARGETS = ["BNC", "BIC", "TNS"] as const;
const CRITERIA = ["ACTIVITÉ", "BUDGET", "PATRIMOINE", "PROJET"] as const;

function cubeAngle(step: number) {
  if (step >= 10) return 180;
  if (step >= 6) return 90;
  return 0;
}

function ThemeTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h1 className="text-4xl font-medium tracking-[0.18em] text-foreground uppercase">
        {title}
      </h1>
      <p className="text-[11px] tracking-[0.22em] text-zinc-600 uppercase">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * S09 — Révélation HERCULE R2  (steps 0-15, beats 40-55)
 */
export function S09_R2Reveal({ step }: SceneProps) {
  const showCube = step >= 2;

  return (
    <SceneShell>
      <ChapterBadge chapter="Le mécanisme" beat="4/4" />

      {showCube && (
        <motion.div
          className="pointer-events-none absolute opacity-[0.07]"
          animate={{ rotateY: cubeAngle(step) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <RubiksCube state="solved" size={200} spin={false} />
        </motion.div>
      )}

      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div
            key="b40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-6"
          >
            <RubiksCube state="solved" size={64} spin />
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <HerculeLogo size="xl" />
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="b41"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HerculeLogo size="xl" showName showR2 />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="b42"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <ThemeTitle title="Le terrain de jeu" subtitle="Étape 1 — Volume" />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="b43"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <ThemeTitle title="Le terrain de jeu" subtitle="Étape 1 — Volume" />
            <PersonGroup count={20} icon="briefcase" size={24} />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="b44"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <ThemeTitle title="Le terrain de jeu" subtitle="Étape 1 — Volume" />
            <div className="flex gap-4">
              {TARGETS.map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="rounded border border-zinc-700/50 px-6 py-4"
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
            <ThemeTitle title="Le terrain de jeu" subtitle="Étape 1 — Volume" />
            <PersonGroup count={20} icon="briefcase" size={24} />
            <p className="max-w-md text-center text-sm tracking-[0.12em] text-zinc-500">
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
            className="relative z-10 flex items-center gap-10"
          >
            <PersonGroup count={10} icon="briefcase" size={24} />
            <PhoneIcon size={48} className="text-zinc-400" />
          </motion.div>
        )}

        {step === 8 && (
          <motion.div
            key="b48"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 grid grid-cols-2 gap-3"
          >
            {CRITERIA.map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded border border-zinc-700/50 px-6 py-4 text-center"
              >
                <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 9 && (
          <motion.div
            key="b49"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex items-end gap-6"
          >
            <PersonGroup count={6} size={26} highlightCount={0} />
            <PersonGroup count={4} icon="briefcase" size={28} checked highlightCount={4} />
          </motion.div>
        )}

        {step === 10 && (
          <motion.div
            key="b50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <ThemeTitle title="Le renversement" subtitle="Étape 3 — Intérêt" />
          </motion.div>
        )}

        {step === 11 && (
          <motion.div
            key="b51"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex items-center gap-8"
          >
            <Person size={44} icon="briefcase" checked />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded border border-zinc-700/50 px-5 py-3 text-sm tracking-[0.12em] text-zinc-400"
            >
              Une problématique précise.
            </motion.div>
          </motion.div>
        )}

        {step === 12 && (
          <motion.div
            key="b52"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <p className="text-base tracking-[0.08em] text-zinc-300">
              Souhaitez-vous prendre rendez-vous ?
            </p>
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              className="text-3xl text-zinc-300"
            >
              ✓
            </motion.span>
          </motion.div>
        )}

        {step === 13 && (
          <motion.div
            key="b53"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex items-center gap-8"
          >
            <Person size={44} icon="briefcase" checked />
            <motion.span
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-light text-zinc-300"
            >
              ←
            </motion.span>
            <Person size={44} icon="briefcase" />
          </motion.div>
        )}

        {step === 14 && (
          <motion.div
            key="b54"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <Person size={44} icon="briefcase" checked />
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 15 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === 9 ? 1 : 0.2 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex h-12 w-12 items-center justify-center border text-sm ${i === 9 ? "border-zinc-400 bg-zinc-800 text-zinc-200" : "border-zinc-800 text-zinc-700"}`}
                >
                  {i === 9 ? "14:07" : ""}
                </motion.div>
              ))}
            </div>
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              className="text-3xl text-zinc-300"
            >
              ✓
            </motion.span>
          </motion.div>
        )}

        {step === 15 && (
          <motion.div
            key="b55"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <HerculeLogo size="lg" showName showR2 />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <SceneLabel size="sm" animate={false}>VOLUME</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>QUALIFICATION</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>INTÉRÊT</SceneLabel>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
