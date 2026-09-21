"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { FlowLine }    from "../shared/FlowLine";
import { HerculeLogo } from "../shared/HerculeLogo";
import { Person, PersonGroup } from "../shared/Person";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S09 — Révélation HERCULE R2  (steps 0-6, beats 40-46)
 *
 * 0 – Cube → logo (morphing)
 * 1 – Logo + R2
 * 2 – Première étape : VOLUME
 * 3 – Deuxième étape : QUALIFICATION
 * 4 – Troisième étape : INTÉRÊT
 * 5 – Rendez-vous 14:07 ✓
 * 6 – Révélation complète
 */
export function S09_R2Reveal({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {/* beat 40 — logo émerge du cube */}
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

        {/* beat 41 — R2 */}
        {step === 1 && (
          <motion.div
            key="b41"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HerculeLogo size="xl" showName showR2 />
          </motion.div>
        )}

        {/* beat 42 — VOLUME */}
        {step === 2 && (
          <motion.div
            key="b42"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <SceneLabel size="xl" animate={false}>VOLUME</SceneLabel>
            <PersonGroup count={20} icon="briefcase" size={24} />
          </motion.div>
        )}

        {/* beat 43 — QUALIFICATION */}
        {step === 3 && (
          <motion.div
            key="b43"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <SceneLabel size="xl" animate={false}>QUALIFICATION</SceneLabel>
            <div className="flex items-end gap-4">
              <PersonGroup count={8} size={24} highlightCount={0} />
              <PersonGroup count={5} icon="briefcase" size={26} checked />
            </div>
          </motion.div>
        )}

        {/* beat 44 — INTÉRÊT */}
        {step === 4 && (
          <motion.div
            key="b44"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <SceneLabel size="xl" animate={false}>INTÉRÊT</SceneLabel>
            <div className="flex items-end gap-6">
              <PersonGroup count={4} icon="briefcase" size={26} checked />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded border border-zinc-700/50 px-4 py-2 text-sm text-zinc-500"
              >
                ?
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Person size={32} icon="briefcase" checked />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* beat 45 — rendez-vous */}
        {step === 5 && (
          <motion.div
            key="b45"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <Person size={44} icon="briefcase" checked />
            {/* mini calendar slot */}
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

        {/* beat 46 — révélation complète */}
        {step === 6 && (
          <motion.div
            key="b46"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-8"
          >
            {/* cube ghost en arrière */}
            <div className="absolute opacity-[0.08]">
              <RubiksCube state="solved" size={160} spin />
            </div>

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
              <SceneLabel size="sm" animate={false}>PRISE DE RENDEZ-VOUS</SceneLabel>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
