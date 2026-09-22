"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { HerculeMark } from "@/components/hercule-mark";
import { FlowLine }    from "../shared/FlowLine";
import { Person }      from "../shared/Person";
import { PhoneIcon }   from "../shared/PhoneIcon";
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
            className="flex flex-col items-center gap-8"
          >
            <motion.span
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="text-6xl font-thin text-zinc-400"
            >
              ?
            </motion.span>
            <p className="max-w-sm text-center text-sm tracking-[0.1em] text-zinc-600">
              Comment se mettre en face de millions de professionnels ?
            </p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="s11-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-light tracking-[0.18em] text-zinc-300 uppercase"
            >
              Vous ne le faites pas.
            </motion.p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s11-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex flex-col items-center gap-4"
          >
            <RubiksCube state="solved" size={96} spin />
            <p className="text-sm tracking-[0.2em] text-zinc-500 uppercase">
              Hercule s&apos;en charge
            </p>
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
            <HerculeMark variant="mono" className="size-8 text-foreground" />
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
            <PhoneIcon size={36} className="text-zinc-400" />
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
            <RubiksCube state="solved" size={72} spin={false} />
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
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 15 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i < 6 ? 0.1 : 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex h-14 w-14 items-center justify-center border ${i < 6 ? "border-zinc-800" : "border-zinc-600/60 bg-zinc-800/50"}`}
                >
                  {i >= 6 && <div className="size-1.5 rounded-full bg-zinc-400" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 9 && (
          <motion.div key="s11-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-16"
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
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Person size={56} icon="briefcase" checked />
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
