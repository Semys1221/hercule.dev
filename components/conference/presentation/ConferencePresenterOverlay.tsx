"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOTAL_BEATS } from "./beats";
import type { Cue } from "./cues";
import { SCENE_LABELS, type SceneId } from "./types";

type ConferencePresenterOverlayProps = {
  visible?: boolean;
  showFlash: boolean;
  trainingMode: boolean;
  presenterMode: boolean;
  beatId: number;
  scene: SceneId;
  cue: Cue | undefined;
  isLast: boolean;
  nextLabel: string | null;
};

export const ConferencePresenterOverlay = memo(function ConferencePresenterOverlay({
  visible = true,
  showFlash,
  trainingMode,
  presenterMode,
  beatId,
  scene,
  cue,
  isLast,
  nextLabel,
}: ConferencePresenterOverlayProps) {
  const sceneLabel = SCENE_LABELS[scene];

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {showFlash ? (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute bottom-4 right-5 z-[60] font-mono text-[11px] tabular-nums text-muted-foreground"
          >
            {beatId} / {TOTAL_BEATS}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {trainingMode && cue ? (
          <motion.div
            key="training"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[61] flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-8 pb-6 pt-10 text-center"
          >
            <p className="font-mono text-sm tracking-widest text-muted-foreground">
              Point {beatId} / {TOTAL_BEATS} · {sceneLabel}
            </p>
            <p className="text-base font-medium tracking-widest text-foreground uppercase">
              {cue.label}
            </p>
            {cue.phrase ? (
              <p className="max-w-2xl text-lg italic leading-relaxed text-muted-foreground">
                « {cue.phrase} »
              </p>
            ) : null}
            {isLast ? (
              <p className="mt-1 font-mono text-sm tracking-widest text-muted-foreground uppercase">
                Fin de présentation
              </p>
            ) : (
              <p className="mt-1 font-mono text-sm text-muted-foreground">→ {nextLabel}</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {presenterMode ? (
          <motion.div
            key="hud"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute bottom-6 left-1/2 z-[62] -translate-x-1/2"
          >
            <div className="w-80 rounded border border-border bg-card/90 px-5 py-4 shadow-2xl backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  Point {beatId} / {TOTAL_BEATS}
                </span>
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  {sceneLabel}
                </span>
              </div>

              {cue ? (
                <p className="mb-2 text-xs font-medium tracking-widest text-foreground uppercase">
                  {cue.label}
                </p>
              ) : null}

              {cue?.phrase ? (
                <p className="mb-3 text-[11px] italic leading-relaxed text-muted-foreground">
                  « {cue.phrase} »
                </p>
              ) : null}

              {isLast ? (
                <p className="text-center text-[10px] tracking-widest text-muted-foreground uppercase">
                  FIN DE PRÉSENTATION
                </p>
              ) : (
                <div className="rounded bg-card/70 px-3 py-2">
                  <p className="mb-0.5 text-[9px] tracking-widest text-muted-foreground uppercase">
                    [ESPACE] →
                  </p>
                  <p className="text-[11px] text-muted-foreground">{nextLabel}</p>
                </div>
              )}

              <p className="mt-3 border-t border-border pt-2 text-center text-[8px] tracking-widest text-muted-foreground">
                H fermer · ⌘Espace entraînement · T bascule · F plein écran
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!trainingMode && !presenterMode ? (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-4 z-[60] text-[10px] tracking-widest text-muted-foreground uppercase"
        >
          {sceneLabel} · {beatId}
        </div>
      ) : null}
    </>
  );
});
