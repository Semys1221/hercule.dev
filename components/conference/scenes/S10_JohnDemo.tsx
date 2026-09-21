"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SceneProps } from "../presentation/types";
import { ChapterBadge } from "../shared/ChapterBadge";
import { Counter }     from "../shared/Counter";
import { FlowLine }    from "../shared/FlowLine";
import { Person, PersonGroup } from "../shared/Person";
import { PhoneIcon }   from "../shared/PhoneIcon";
import { RubiksCube }  from "../shared/RubiksCube";
import { SceneLabel }  from "../shared/SceneLabel";
import { SceneShell }  from "../shared/SceneShell";

/**
 * S10 — Démonstration John  (steps 0-23, beats 56-79)
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
      <ChapterBadge chapter="La démonstration" beat="John" />
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
            className="flex flex-col items-center gap-5"
          >
            <p className="text-[10px] tracking-[0.22em] text-zinc-600 uppercase">Volume identifié</p>
            <div className="flex items-center gap-8">
              <PersonGroup count={10} icon="briefcase" size={32} />
              <FlowLine dir="right" />
              <PhoneIcon size={44} className="text-zinc-400" />
            </div>
          </motion.div>
        )}

        {/* 7 — critères de qualification */}
        {step === 7 && (
          <motion.div key="s10-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <p className="text-[10px] tracking-[0.22em] text-zinc-600 uppercase">Chaque profil vérifié sur</p>
            <div className="flex gap-4">
              {["ACTIVITÉ", "BUDGET", "PROJET"].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.18 }}
                  className="flex flex-col items-center gap-3 rounded border border-zinc-700/40 px-6 py-5"
                >
                  <span className="text-xl text-zinc-200">✓</span>
                  <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 8 — sélection */}
        {step === 8 && (
          <motion.div key="s10-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-end gap-8"
          >
            <div className="flex flex-col items-center gap-2">
              <PersonGroup count={6} size={32} highlightCount={0} />
              <p className="text-[9px] tracking-[0.2em] text-zinc-700 uppercase">Éliminés</p>
            </div>
            <div className="h-20 w-px bg-zinc-800" />
            <div className="flex flex-col items-center gap-2">
              <PersonGroup count={4} icon="briefcase" size={36} checked highlightCount={4} />
              <p className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase">Qualifiés</p>
            </div>
          </motion.div>
        )}

        {/* 9 — qualification conservée */}
        {step === 9 && (
          <motion.div key="s10-9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <p className="text-[10px] tracking-[0.22em] text-zinc-600 uppercase">Profils qualifiés conservés</p>
            <div className="flex gap-6">
              {Array.from({ length: 4 }, (_, i) => (
                <Person key={i} size={48} icon="briefcase" checked delay={i * 0.1} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 10 — problème présenté */}
        {step === 10 && (
          <motion.div key="s10-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-start gap-8"
          >
            <Person size={52} icon="briefcase" checked />
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 flex flex-col gap-2 rounded border border-zinc-700/50 px-6 py-4"
            >
              <p className="text-[10px] tracking-[0.18em] text-zinc-600 uppercase">Problématique</p>
              <p className="text-base tracking-wide text-zinc-300">CA ↑ · Marge ↓</p>
            </motion.div>
          </motion.div>
        )}

        {/* 11 — compréhension */}
        {step === 11 && (
          <motion.div key="s10-11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-10"
          >
            <Person size={52} icon="briefcase" checked />
            <div className="flex flex-col items-center gap-2">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 280 }}
                className="text-4xl text-zinc-200"
              >
                ✓
              </motion.span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase"
              >
                Reconnaît le problème
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* 12 — INVERSION (moment clé) */}
        {step === 12 && (
          <motion.div key="s10-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-12"
          >
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            >
              <Person size={40} icon="briefcase" />
              <span className="text-2xl text-zinc-300">→</span>
              <Person size={40} />
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-6">
                <Person size={44} icon="briefcase" />
                <motion.span
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2.3, duration: 0.5 }}
                  className="text-4xl font-light text-zinc-200"
                >
                  ←
                </motion.span>
                <Person size={40} icon="briefcase" checked />
              </div>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 2.7 }}
                className="text-sm tracking-[0.28em] text-zinc-300 uppercase"
              >
                C&apos;est lui qui vient vous chercher
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* 13 — prise de RDV */}
        {step === 13 && (
          <motion.div key="s10-13" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <Person size={44} icon="briefcase" checked />
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === 4 ? 1 : 0.15 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex h-14 w-14 flex-col items-center justify-center border text-xs ${
                    i === 4
                      ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                      : "border-zinc-800 text-zinc-700"
                  }`}
                >
                  {i === 4 && (
                    <>
                      <span className="text-[10px] text-zinc-500 uppercase">Mar</span>
                      <span className="text-sm font-medium text-zinc-200">14:07</span>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-2xl text-zinc-300"
            >✓</motion.span>
          </motion.div>
        )}

        {/* 14 — 2 RDV / semaine */}
        {step === 14 && (
          <motion.div key="s10-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-8">
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.25 }}
                >
                  <Person size={48} icon="briefcase" checked />
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-2xl font-light tracking-[0.22em] text-zinc-200 uppercase"
            >
              × 2 / semaine
            </motion.p>
          </motion.div>
        )}

        {/* 15 — pas simplement 2 RDV */}
        {step === 15 && (
          <motion.div key="s10-15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex gap-10">
              <Person size={48} icon="briefcase" checked />
              <Person size={48} icon="briefcase" checked delay={0.2} />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm tracking-[0.18em] text-zinc-500 uppercase"
            >
              Qui ont demandé à vous parler
            </motion.p>
          </motion.div>
        )}

        {/* 16 — profils avec ✓✓✓ */}
        {step === 16 && (
          <motion.div key="s10-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-12"
          >
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Person size={48} icon="briefcase" checked delay={i * 0.1} />
                <div className="flex flex-col gap-1">
                  {["Volume", "Qualifié", "Intéressé"].map((tag, j) => (
                    <motion.p
                      key={tag}
                      className="text-[9px] tracking-[0.18em] text-zinc-600 uppercase"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 + j * 0.08 }}
                    >
                      ✓ {tag}
                    </motion.p>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* 17 — timeline 90j */}
        {step === 17 && (
          <motion.div key="s10-17" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="flex items-center">
              {(["J1", "J30", "J60", "J90"] as const).map((d, i) => (
                <span key={d} className="flex items-center">
                  {i > 0 && (
                    <motion.div
                      className="h-px w-16 bg-zinc-800"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.18, duration: 0.3 }}
                    />
                  )}
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.18 }}
                  >
                    <div className={`size-2 rounded-full ${i === 3 ? "bg-zinc-300" : "bg-zinc-700"}`} />
                    <span className={`text-[10px] tracking-wider ${i === 3 ? "text-zinc-300" : "text-zinc-600"}`}>{d}</span>
                  </motion.div>
                </span>
              ))}
            </div>
            <PersonGroup count={12} icon="briefcase" size={32} checked />
          </motion.div>
        )}

        {/* 18 — 30 profils */}
        {step === 18 && (
          <motion.div key="s10-18" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex flex-col items-center gap-1">
              <p className="text-7xl font-thin tabular-nums text-zinc-200">
                <Counter to={30} duration={1.2} />
              </p>
              <p className="text-[11px] tracking-[0.22em] text-zinc-600 uppercase">
                Profils qualifiés · 90 jours
              </p>
            </div>
            <PersonGroup count={12} icon="briefcase" size={30} checked />
          </motion.div>
        )}

        {/* 19 — exemples */}
        {step === 19 && (
          <motion.div key="s10-19" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-16"
          >
            {(["RESTAURANTS", "BTP", "CHIRURGIENS"] as const).map((label, i) => {
              const icon = i === 0 ? "fork" : i === 1 ? "hammer" : "stethoscope";
              return (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center gap-4"
                >
                  <Person size={52} icon={icon as "fork" | "hammer" | "stethoscope"} />
                  <SceneLabel size="xs" animate={false}>{label}</SceneLabel>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 20 — conversion 50 % */}
        {step === 20 && (
          <motion.div key="s10-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <PersonGroup count={20} icon="briefcase" size={28} highlightCount={10} />
            <div className="flex items-center gap-3">
              <span className="text-2xl font-thin text-zinc-300">1 / 2</span>
              <p className="text-[11px] tracking-[0.2em] text-zinc-600 uppercase">
                deviennent clients
              </p>
            </div>
          </motion.div>
        )}

        {/* 21 — finalité */}
        {step === 21 && (
          <motion.div key="s10-21" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <SceneLabel size="sm" animate={false}>PROFESSIONNELS</SceneLabel>
            <FlowLine dir="down" />
            <SceneLabel size="sm" animate={false}>QUALIFICATION</SceneLabel>
            <FlowLine dir="down" />
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <SceneLabel size="lg" animate={false}>AGENDA</SceneLabel>
              <Person size={44} icon="briefcase" />
            </motion.div>
          </motion.div>
        )}

        {/* 22 — pas du trafic */}
        {step === 22 && (
          <motion.div key="s10-22" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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

        {/* 23 — flux continu → agenda */}
        {step === 23 && (
          <motion.div key="s10-23" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <PersonGroup count={8} icon="briefcase" size={32} checked />
            <FlowLine dir="down" />
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex h-14 w-14 items-center justify-center border border-zinc-700/60 bg-zinc-800/50"
                >
                  <div className="size-1.5 rounded-full bg-zinc-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}
