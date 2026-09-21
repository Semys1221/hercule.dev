"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { FlowLine }    from "../shared/FlowLine";
import { HerculeLogo } from "../shared/HerculeLogo";
import { Person, PersonGroup } from "../shared/Person";
import { ChapterBadge } from "../shared/ChapterBadge";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S01 — Introduction  (steps 0-6, beats 1-7)
 *
 * 0 – Écran noir quasi vide
 * 1 – Ligne + personnages dispersés
 * 2 – Carte PARTICULIERS vs PROFESSIONNELS
 * 3 – Trois marchés
 * 4 – CAPACITÉ À INVESTIR
 * 5 – Evan / HERCULE.DEV
 * 6 – Promesse : logo + flux
 */
export function S01_Intro({ step }: SceneProps) {
  return (
    <SceneShell>
      <ChapterBadge chapter="Le terrain" beat="1/4" />
      <AnimatePresence mode="wait">

        {/* ── beat 1 — noir ── */}
        {step === 0 && (
          <motion.div
            key="b01"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />
        )}

        {/* ── beat 2 — terrain ── */}
        {step === 1 && (
          <motion.div
            key="b02"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8"
          >
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 0.7 }}
              className="h-px w-48 bg-zinc-700"
            />
            <PersonGroup count={12} size={26} />
          </motion.div>
        )}

        {/* ── beat 3 — PROFESSIONNELS ── */}
        {step === 2 && (
          <motion.div
            key="b03"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-end gap-8"
          >
            {/* PARTICULIERS — recule */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0.35, scale: 0.88 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3 rounded border border-zinc-700/40 px-6 py-4"
            >
              <SceneLabel size="xs" muted animate={false}>PARTICULIERS</SceneLabel>
              <Person size={36} highlighted={false} />
            </motion.div>

            {/* PROFESSIONNELS — grossit */}
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1.06 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3 rounded border border-zinc-500/60 px-8 py-5"
            >
              <SceneLabel size="sm" animate={false}>PROFESSIONNELS</SceneLabel>
              <Person size={44} icon="briefcase" />
            </motion.div>
          </motion.div>
        )}

        {/* ── beat 4 — trois marchés ── */}
        {step === 3 && (
          <motion.div
            key="b04"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-6"
          >
            {(["COMPTABILITÉ", "COURTAGE FINANCIER", "ASSURANCE"] as const).map(
              (label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  className="flex flex-col items-center gap-3 rounded border border-zinc-700/50 px-5 py-4"
                >
                  <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
                  <PersonGroup count={3} icon="briefcase" size={24} />
                </motion.div>
              ),
            )}
          </motion.div>
        )}

        {/* ── beat 5 — capacité à investir ── */}
        {step === 4 && (
          <motion.div
            key="b05"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <Person size={52} icon="briefcase" />
            <div className="flex flex-col items-center gap-3">
              {[
                { label: "ENTREPRISE", size: "sm" as const, muted: true, delay: 0 },
                { label: "REVENUS", size: "sm" as const, muted: true, delay: 0.4 },
                { label: "CAPACITÉ À INVESTIR", size: "xl" as const, muted: false, delay: 0.9 },
              ].map(({ label, size, muted, delay }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: muted ? 0.3 : 1, y: 0 }}
                  transition={{ delay, duration: 0.4 }}
                >
                  <SceneLabel size={size} muted={muted} animate={false}>{label}</SceneLabel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── beat 6 — Evan ── */}
        {step === 5 && (
          <motion.div
            key="b06"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Avatar placeholder */}
            <div className="flex size-24 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
              <Person size={52} />
            </div>
            <SceneLabel size="lg" animate={false}>HERCULE.DEV</SceneLabel>
            <p className="text-sm text-zinc-700">Fondateur</p>
          </motion.div>
        )}

        {/* ── beat 7 — promesse ── */}
        {step === 6 && (
          <motion.div
            key="b07"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <HerculeLogo size="lg" showName />
            <PersonGroup count={5} icon="briefcase" size={28} />
            <div className="flex flex-col items-center gap-1">
              <SceneLabel size="sm" delay={0.1} animate={false}>PROFESSIONNELS</SceneLabel>
              <FlowLine dir="down" delay={0.2} />
              <SceneLabel size="sm" delay={0.3} animate={false}>QUALIFICATION</SceneLabel>
              <FlowLine dir="down" delay={0.4} />
              <SceneLabel size="sm" delay={0.5} animate={false}>AGENDA</SceneLabel>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
