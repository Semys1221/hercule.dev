"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { Counter }     from "../shared/Counter";
import { FlowLine }    from "../shared/FlowLine";
import { Person, PersonGroup } from "../shared/Person";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S10 — Démonstration John  (steps 0-25, beats 47-72)
 *
 * 0  – John · Cabinet  (beat 47)
 * 1  – Objectif : pros qualifiés  (48)
 * — ÉTAPE 1 : VOLUME
 * 2  – Carte France / base régionale  (49)
 * 3  – Extension nationale  (50)
 * 4  – Calendrier vide  (51)
 * 5  – C'est normal / face VOLUME du cube  (52)
 * — ÉTAPE 2 : QUALIFICATION
 * 6  – Flux → téléphone  (53)
 * 7  – Questions de qualification  (54)
 * 8  – Sélection bons / mauvais  (55)
 * 9  – Qualification conservée (badges)  (56)
 * — ÉTAPE 3 : INTÉRÊT
 * 10 – Profil qualifié + problème  (57)
 * 11 – Compréhension → ✓  (58)
 * 12 – Inversion JOHN → PROS  (59)  ← moment clé
 * 13 – Prise de RDV  (60)
 * 14 – Plus besoin de courir  (61)
 * 15 – Prospect vient à John  (62)
 * — RÉSULTAT
 * 16 – 2 RDV / semaine  (63)
 * 17 – Ce sont 2 professionnels qualifiés  (64)
 * 18 – Profils avec trois ✓  (65)
 * — 90 JOURS
 * 19 – Timeline 90j  (66)
 * 20 – 30 profils qualifiés  (67)
 * 21 – Restaurants / BTP / Chirurgiens  (68)
 * 22 – Conversion 50 %  (69)
 * 23 – Finalité  (70)
 * 24 – Pas du trafic  (71)
 * 25 – Flux continu → agenda  (72)
 */
export function S10_JohnDemo({ step }: SceneProps) {
  return (
    <SceneShell>
      <AnimatePresence mode="wait">

        {/* 0 — John */}
        {step === 0 && (
          <motion.div key="s10-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <Person size={52} icon="briefcase" />
            <SceneLabel size="lg" animate={false}>JOHN · CABINET</SceneLabel>
            <div className="flex gap-4 text-sm tracking-widest text-zinc-600 uppercase">
              <span>Comptabilité</span><span>IAS</span><span>CIF</span>
            </div>
          </motion.div>
        )}

        {/* 1 — objectif */}
        {step === 1 && (
          <motion.div key="s10-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-16"
          >
            <Person size={44} icon="briefcase" />
            <PersonGroup count={5} icon="briefcase" size={28} highlightCount={0} />
          </motion.div>
        )}

        {/* 2 — carte France */}
        {step === 2 && (
          <motion.div key="s10-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* simplified France silhouette */}
            <svg viewBox="0 0 100 100" className="h-36 w-32 text-zinc-700" aria-hidden fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M20 20 Q35 10 55 15 Q70 12 80 25 Q90 38 85 55 Q88 70 75 80 Q60 92 45 88 Q30 90 18 75 Q8 62 12 45 Q10 32 20 20Z" />
              <ellipse cx="42" cy="50" rx="14" ry="12" strokeWidth="1" className="text-zinc-500" />
            </svg>
            <PersonGroup count={10} icon="briefcase" size={22} />
          </motion.div>
        )}

        {/* 3 — extension nationale */}
        {step === 3 && (
          <motion.div key="s10-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <svg viewBox="0 0 100 100" className="h-36 w-32 text-zinc-600" aria-hidden fill="none" stroke="currentColor" strokeWidth="0.8">
              <path d="M20 20 Q35 10 55 15 Q70 12 80 25 Q90 38 85 55 Q88 70 75 80 Q60 92 45 88 Q30 90 18 75 Q8 62 12 45 Q10 32 20 20Z" />
            </svg>
            <PersonGroup count={20} icon="briefcase" size={20} />
          </motion.div>
        )}

        {/* 4 — calendrier vide */}
        {step === 4 && (
          <motion.div key="s10-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="grid grid-cols-7 gap-1 opacity-30">
              {Array.from({ length: 28 }, (_, i) => (
                <div key={i} className="h-10 w-10 border border-zinc-800" />
              ))}
            </div>
            <p className="text-sm text-zinc-500 tracking-widest uppercase">0 rendez-vous</p>
          </motion.div>
        )}

        {/* 5 — C'est normal / face VOLUME */}
        {step === 5 && (
          <motion.div key="s10-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <RubiksCube state="scrambled" size={80} spin={false} faceLabels={["VOLUME"]} />
            <PersonGroup count={16} icon="briefcase" size={22} />
          </motion.div>
        )}

        {/* 6 — téléphone sélectif */}
        {step === 6 && (
          <motion.div key="s10-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-10"
          >
            <PersonGroup count={10} icon="briefcase" size={24} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className="size-12 text-zinc-400" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}

        {/* 7 — critères de qualification */}
        {step === 7 && (
          <motion.div key="s10-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded border border-zinc-700/50 px-8 py-6 font-mono text-base"
          >
            {["ACTIVITÉ ✓", "BUDGET ✓", "PROJET ✓"].map((line, i) => (
              <motion.p key={line} className="mb-2 text-zinc-300"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}>
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}

        {/* 8 — sélection */}
        {step === 8 && (
          <motion.div key="s10-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-end gap-6"
          >
            <PersonGroup count={6} size={26} highlightCount={0} />
            <PersonGroup count={4} icon="briefcase" size={28} />
          </motion.div>
        )}

        {/* 9 — qualification conservée */}
        {step === 9 && (
          <motion.div key="s10-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <Person key={i} size={32} icon="briefcase" checked delay={i * 0.08} />
            ))}
          </motion.div>
        )}

        {/* 10 — problème présenté */}
        {step === 10 && (
          <motion.div key="s10-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-8"
          >
            <Person size={44} icon="briefcase" checked />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded border border-zinc-700/50 px-5 py-3 text-2xl text-zinc-500"
            >
              ?
            </motion.div>
          </motion.div>
        )}

        {/* 11 — compréhension */}
        {step === 11 && (
          <motion.div key="s10-11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-8"
          >
            <Person size={44} icon="briefcase" checked />
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-3xl text-zinc-300"
            >
              ✓
            </motion.span>
          </motion.div>
        )}

        {/* 12 — INVERSION (moment clé) */}
        {step === 12 && (
          <motion.div key="s10-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            {/* avant */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <SceneLabel size="sm" muted animate={false}>JOHN</SceneLabel>
              <span className="text-zinc-500">→</span>
              <SceneLabel size="sm" muted animate={false}>PROFESSIONNEL</SceneLabel>
            </motion.div>

            {/* après — inversion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-6"
            >
              <Person size={44} icon="briefcase" checked />
              <motion.span
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-3xl font-light text-zinc-300"
              >
                ←
              </motion.span>
              <Person size={44} icon="briefcase" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="text-xs tracking-[0.22em] text-zinc-500 uppercase"
            >
              Le prospect vient vous chercher
            </motion.p>
          </motion.div>
        )}

        {/* 13 — prise de RDV */}
        {step === 13 && (
          <motion.div key="s10-13" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <Person size={44} icon="briefcase" checked />
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className={`flex h-12 w-12 items-center justify-center border text-xs ${i === 9 ? "border-zinc-400 bg-zinc-800 text-zinc-200" : "border-zinc-800 text-zinc-700 opacity-30"}`}>
                  {i === 9 ? "14:07" : ""}
                </div>
              ))}
            </div>
            <span className="text-2xl text-zinc-300">✓</span>
          </motion.div>
        )}

        {/* 14 — plus besoin de courir */}
        {step === 14 && (
          <motion.div key="s10-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-12"
          >
            <div className="flex flex-col items-center gap-2 opacity-25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-zinc-500" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-xs text-zinc-700">? ? ?</p>
            </div>
            <div className="rounded border border-zinc-600/50 px-4 py-2">
              <p className="text-xs tracking-widest text-zinc-300 uppercase">RDV CONFIRMÉ</p>
            </div>
          </motion.div>
        )}

        {/* 15 — prospect arrive vers John */}
        {step === 15 && (
          <motion.div key="s10-15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-12"
          >
            <Person size={48} icon="briefcase" />
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Person size={44} icon="briefcase" checked />
            </motion.div>
          </motion.div>
        )}

        {/* 16 — 2 RDV / semaine */}
        {step === 16 && (
          <motion.div key="s10-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex gap-5">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2, type: "spring" }}
                  className="size-3 rounded-full bg-zinc-200"
                />
              ))}
            </div>
            <p className="text-xl font-light text-zinc-200 tracking-widest uppercase">2 rendez-vous / semaine</p>
          </motion.div>
        )}

        {/* 17 — pas simplement 2 RDV */}
        {step === 17 && (
          <motion.div key="s10-17" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-10"
          >
            <Person size={44} icon="briefcase" checked />
            <Person size={44} icon="briefcase" checked delay={0.15} />
          </motion.div>
        )}

        {/* 18 — profils avec ✓✓✓ */}
        {step === 18 && (
          <motion.div key="s10-18" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-10"
          >
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Person size={44} icon="briefcase" checked delay={i * 0.1} />
                <p className="text-xs text-zinc-500">✓ ✓ ✓</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* 19 — timeline 90j */}
        {step === 19 && (
          <motion.div key="s10-19" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-1 text-sm text-zinc-600">
              {["J1", "J30", "J60", "J90"].map((d, i) => (
                <span key={d} className="flex items-center gap-1">
                  {i > 0 && <div className="h-px w-12 bg-zinc-800" />}
                  <span>{d}</span>
                </span>
              ))}
            </div>
            <PersonGroup count={12} icon="briefcase" size={24} checked />
          </motion.div>
        )}

        {/* 20 — 30 profils */}
        {step === 20 && (
          <motion.div key="s10-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <p className="text-5xl font-thin text-zinc-200 tabular-nums">
              <Counter to={30} duration={1} />
            </p>
            <PersonGroup count={10} icon="briefcase" size={22} checked />
          </motion.div>
        )}

        {/* 21 — exemples */}
        {step === 21 && (
          <motion.div key="s10-21" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-12"
          >
            {(["RESTAURANTS", "BTP", "CHIRURGIENS"] as const).map((label, i) => {
              const icon = i === 0 ? "fork" : i === 1 ? "hammer" : "stethoscope";
              return (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Person size={36} icon={icon as any} />
                  <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 22 — conversion 50 % */}
        {step === 22 && (
          <motion.div key="s10-22" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-end gap-8"
          >
            <PersonGroup count={15} size={24} highlightCount={0} />
            <PersonGroup count={15} icon="briefcase" size={26} />
          </motion.div>
        )}

        {/* 23 — finalité */}
        {step === 23 && (
          <motion.div key="s10-23" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <SceneLabel size="sm" animate={false}>PROFESSIONNELS</SceneLabel>
            <FlowLine dir="down" />
            <SceneLabel size="sm" animate={false}>QUALIFICATION</SceneLabel>
            <FlowLine dir="down" />
            <SceneLabel size="sm" animate={false}>AGENDA</SceneLabel>
          </motion.div>
        )}

        {/* 24 — pas du trafic */}
        {step === 24 && (
          <motion.div key="s10-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {["TRAFIC", "LEADS"].map((word) => (
              <motion.p
                key={word}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.3, textDecorationLine: "line-through" as const }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl tracking-widest text-zinc-400 uppercase"
              >
                {word}
              </motion.p>
            ))}
          </motion.div>
        )}

        {/* 25 — flux continu → agenda */}
        {step === 25 && (
          <motion.div key="s10-25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <PersonGroup count={8} icon="briefcase" size={24} checked />
            <FlowLine dir="down" />
            {/* mini calendar filling */}
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex h-11 w-11 items-center justify-center border border-zinc-700/60 bg-zinc-800/50"
                >
                  <Person size={14} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </SceneShell>
  );
}
