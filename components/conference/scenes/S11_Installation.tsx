"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { FlowLine }    from "../shared/FlowLine";
import { HerculeLogo } from "../shared/HerculeLogo";
import { Person }      from "../shared/Person";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S11 — Installation  (steps 0-9, beats 73-82)
 *
 * 0 – Comment se mettre en face de millions de pros ?
 * 1 – Silence / réponse : vous ne le faites pas
 * 2 – Logo Hercule + cube
 * 3 – Connexion calendrier
 * 4 – Zoom Pro
 * 5 – Appel d'intégration + checklist
 * 6 – Adaptabilité (3 profils)
 * 7 – Système tourne en arrière-plan
 * 8 – Agenda se remplit
 * 9 – Votre rôle : Zoom → audit → offre
 */
export function S11_Installation({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {step === 0 && (
          <motion.div key="s11-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.span
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl font-thin text-zinc-500"
            >
              ?
            </motion.span>
            {/* France dots */}
            <svg viewBox="0 0 100 100" className="h-24 w-20 text-zinc-800" aria-hidden fill="none" stroke="currentColor" strokeWidth="0.6">
              <path d="M20 20 Q35 10 55 15 Q70 12 80 25 Q90 38 85 55 Q88 70 75 80 Q60 92 45 88 Q30 90 18 75 Q8 62 12 45 Q10 32 20 20Z" />
              {Array.from({ length: 30 }, (_, i) => (
                <circle key={i} cx={20 + (i % 6) * 10} cy={25 + Math.floor(i / 6) * 12} r="0.8" fill="currentColor" className="text-zinc-600" />
              ))}
            </svg>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s11-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              {/* France fades instantly */}
            </motion.div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s11-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-4"
          >
            <HerculeLogo size="xl" showName />
            <div className="absolute opacity-[0.07]">
              <RubiksCube state="solved" size={160} spin />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s11-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            {/* calendar icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-7 text-zinc-400" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            <FlowLine dir="right" />
            <HerculeLogo size="sm" />
            <FlowLine dir="right" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-7 text-zinc-400" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" />
            </svg>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s11-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-7 text-zinc-400" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            <FlowLine dir="right" />
            <span className="text-xs tracking-widest text-zinc-400 uppercase">Zoom</span>
            <FlowLine dir="right" />
            <span className="text-xs tracking-widest text-zinc-400 uppercase">RDV</span>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s11-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-9 text-zinc-400" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.25, type: "spring" }}
                  className="flex size-8 items-center justify-center border border-zinc-600/60"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="size-4 text-zinc-400" aria-hidden>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="s11-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-10"
          >
            {(["fork", "briefcase", "stethoscope"] as const).map((icon, i) => (
              <motion.div key={icon}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
              >
                <Person size={40} icon={icon} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="s11-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex items-center justify-center"
          >
            <HerculeLogo size="lg" showName />
            <motion.div
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -inset-8 rounded-full border border-zinc-700/30"
            />
          </motion.div>
        )}

        {step === 8 && (
          <motion.div key="s11-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 15 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex h-8 w-8 items-center justify-center border ${i < 10 ? "border-zinc-700/40 opacity-20" : "border-zinc-600/60 bg-zinc-800/50"}`}
                >
                  {i >= 10 && <Person size={18} />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="s11-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex flex-col items-center gap-1">
              <SceneLabel size="sm" animate={false}>PROFIL QUALIFIÉ</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>ZOOM</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>AUDIT</SceneLabel>
              <FlowLine dir="down" />
              <SceneLabel size="sm" animate={false}>OFFRE</SceneLabel>
            </div>
            <div className="mt-4 flex gap-10">
              <Person size={36} icon="briefcase" />
              <Person size={40} icon="briefcase" checked delay={0.1} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
