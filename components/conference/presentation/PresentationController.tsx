"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BEATS, TOTAL_BEATS } from "./beats";
import { CUES } from "./cues";
import { SCENE_LABELS, type SceneId } from "./types";
import { FilmGrain } from "../shared/FilmGrain";

import { S01_Intro }            from "../scenes/S01_Intro";
import { S02_WordOfMouth }      from "../scenes/S02_WordOfMouth";
import { S03_WOMProblem }       from "../scenes/S03_WOMProblem";
import { S04_ColdLeads }        from "../scenes/S04_ColdLeads";
import { S05_GoogleAds }        from "../scenes/S05_GoogleAds";
import { S06_Reframing }        from "../scenes/S06_Reframing";
import { S07_ThreeSolutions }   from "../scenes/S07_ThreeSolutions";
import { S08_Mechanism }        from "../scenes/S08_Mechanism";
import { S09_R2Reveal }         from "../scenes/S09_R2Reveal";
import { S10_JohnDemo }         from "../scenes/S10_JohnDemo";
import { S11_Installation }     from "../scenes/S11_Installation";
import { S12_OffersTransition } from "../scenes/S12_OffersTransition";
import { S13_HerculeDEC }       from "../scenes/S13_HerculeDEC";
import { S14_HerculeCourtage }  from "../scenes/S14_HerculeCourtage";
import { S15_FAQ }              from "../scenes/S15_FAQ";
import { S16_Urgency }          from "../scenes/S16_Urgency";
import { S17_Close }            from "../scenes/S17_Close";
import { S18_StaticOffers }     from "../scenes/S18_StaticOffers";
import type { SceneProps } from "./types";
import type { ComponentType } from "react";

const SCENES: Record<SceneId, ComponentType<SceneProps>> = {
  S01_Intro,
  S02_WordOfMouth,
  S03_WOMProblem,
  S04_ColdLeads,
  S05_GoogleAds,
  S06_Reframing,
  S07_ThreeSolutions,
  S08_Mechanism,
  S09_R2Reveal,
  S10_JohnDemo,
  S11_Installation,
  S12_OffersTransition,
  S13_HerculeDEC,
  S14_HerculeCourtage,
  S15_FAQ,
  S16_Urgency,
  S17_Close,
  S18_StaticOffers,
};

const LOCK_MS          = 320;  // anti-spam lock between beats
const FLASH_VISIBLE_MS = 1100; // how long the flash indicator stays visible

export function PresentationController() {
  const [beatIdx, setBeatIdx] = useState(0);

  // ── Guidance state ──────────────────────────────────────────
  /** Flash indicator — appears for ~1 s after every advance */
  const [showFlash, setShowFlash]           = useState(false);
  /** Presenter HUD (H) — full panel with phrase + next action */
  const [presenterMode, setPresenterMode]   = useState(false);
  /** Training overlay (⌘Space / T) — slide counter + phrase + next slide */
  const [trainingMode, setTrainingMode]     = useState(false);

  // ── Refs ────────────────────────────────────────────────────
  const locked       = useRef(false);
  const lockTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Advance / retreat ───────────────────────────────────────
  const advance = useCallback((delta: 1 | -1) => {
    if (locked.current) return;
    locked.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => { locked.current = false; }, LOCK_MS);

    setBeatIdx((i) => Math.max(0, Math.min(TOTAL_BEATS - 1, i + delta)));

    // Trigger flash indicator
    if (delta === 1) {
      setShowFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setShowFlash(false), FLASH_VISIBLE_MS);
    }
  }, []);

  // ── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && e.metaKey) {
        e.preventDefault();
        setTrainingMode((v) => !v);
        return;
      }

      switch (e.key) {
        case " ":
        case "ArrowRight":
          e.preventDefault();
          advance(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          advance(-1);
          break;
        case "h":
        case "H":
          e.preventDefault();
          setPresenterMode((v) => !v);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setTrainingMode((v) => !v);
          break;
        case "f":
        case "F":
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case "Escape":
          // Close presenter panel if open; otherwise let browser handle Esc
          if (presenterMode) {
            e.preventDefault();
            setPresenterMode(false);
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, presenterMode]);

  // ── Body scroll lock ────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────
  useEffect(() => () => {
    if (lockTimer.current)  clearTimeout(lockTimer.current);
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  // ── Derived state ────────────────────────────────────────────
  const beat         = BEATS[beatIdx];
  const cue          = CUES[beat.id];
  const SceneComponent = SCENES[beat.scene];
  const nextBeat     = BEATS[Math.min(beatIdx + 1, TOTAL_BEATS - 1)];
  const nextCue      = CUES[nextBeat.id];
  const isLast       = beatIdx === TOTAL_BEATS - 1;

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "681e2e",
      },
      body: JSON.stringify({
        sessionId: "681e2e",
        runId: "post-fix",
        hypothesisId: "H5",
        location: "PresentationController.tsx:beat",
        message: "active beat changed",
        data: {
          beatIdx,
          beatId: beat.id,
          scene: beat.scene,
          step: beat.step,
          trainingMode,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [beatIdx, beat.id, beat.scene, beat.step, trainingMode]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background">
      <FilmGrain />

      {/* ── Main scene ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.scene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.38 }}
          className="absolute inset-0"
        >
          <SceneComponent step={beat.step} />
        </motion.div>
      </AnimatePresence>

      {/* ── Layer 1 : Flash indicator ──────────────────────── */}
      {/*   Visible ~1 s after each Space press.                */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute bottom-4 right-5 z-[60] font-mono text-[11px] tabular-nums text-zinc-500"
          >
            {beat.id} / {TOTAL_BEATS}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 2 : Training overlay ─────────────────────── */}
      {/*   ⌘Space / T → speaker bar with slide count + next.  */}
      <AnimatePresence>
        {trainingMode && cue && (
          <motion.div
            key="training"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[61] flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-8 pb-6 pt-10 text-center"
          >
            <p className="font-mono text-sm tracking-widest text-zinc-500">
              SLIDE {beat.id} / {TOTAL_BEATS} · {SCENE_LABELS[beat.scene as SceneId]}
            </p>
            <p className="text-base font-medium tracking-widest text-zinc-300 uppercase">
              {cue.label}
            </p>
            {cue.phrase && (
              <p className="max-w-2xl text-lg italic leading-relaxed text-zinc-400">
                « {cue.phrase} »
              </p>
            )}
            {!isLast && (
              <p className="mt-1 font-mono text-sm text-zinc-500">
                → {nextCue?.label ?? nextBeat.scene}
              </p>
            )}
            {isLast && (
              <p className="mt-1 font-mono text-sm tracking-widest text-zinc-600 uppercase">
                Fin de présentation
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 3 : Presenter HUD ─────────────────────────── */}
      {/*   H → full panel. Invisible to audience.              */}
      <AnimatePresence>
        {presenterMode && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute bottom-6 left-1/2 z-[62] -translate-x-1/2"
          >
            <div className="w-80 rounded border border-zinc-700/60 bg-zinc-950/90 px-5 py-4 shadow-2xl backdrop-blur-sm">
              {/* Header */}
              <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-[10px] tracking-widest text-zinc-600">
                  BEAT {beat.id} / {TOTAL_BEATS}
                </span>
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase">
                  {SCENE_LABELS[beat.scene as SceneId]}
                </span>
              </div>

              {/* Label */}
              {cue && (
                <p className="mb-2 text-xs font-medium tracking-widest text-zinc-300 uppercase">
                  {cue.label}
                </p>
              )}

              {/* Phrase */}
              {cue?.phrase && (
                <p className="mb-3 text-[11px] italic leading-relaxed text-zinc-500">
                  « {cue.phrase} »
                </p>
              )}

              {/* Next action */}
              {!isLast && (
                <div className="rounded bg-zinc-900/70 px-3 py-2">
                  <p className="text-[9px] tracking-widest text-zinc-600 uppercase mb-0.5">
                    [SPACE] →
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {nextCue?.label ?? nextBeat.scene}
                  </p>
                </div>
              )}

              {isLast && (
                <p className="text-center text-[10px] tracking-widest text-zinc-600 uppercase">
                  FIN DE PRÉSENTATION
                </p>
              )}

              {/* Legend */}
              <p className="mt-3 border-t border-zinc-800 pt-2 text-center text-[8px] tracking-widest text-zinc-700">
                H fermer · ⌘Space training · T alternate · F plein écran
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Static presenter HUD (always visible at distance) ─ */}
      {!trainingMode && !presenterMode && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-4 z-[60] text-[10px] tracking-widest text-zinc-800 uppercase"
        >
          {SCENE_LABELS[beat.scene as SceneId]} · {beat.id}
        </div>
      )}
    </div>
  );
}
