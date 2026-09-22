"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ConferenceStageAmbient } from "../shared/ConferenceStageAmbient";
import { FilmGrain } from "../shared/FilmGrain";
import { BEATS, SCENE_ORDER, TOTAL_BEATS, TOTAL_SCENES } from "./beats";
import { ConferencePresenterOverlay } from "./ConferencePresenterOverlay";
import { ConferenceSlideChrome } from "./ConferenceSlideChrome";
import { ConferenceSplash } from "./ConferenceSplash";
import { ConferenceVisualStage } from "./ConferenceVisualStage";
import { CUES } from "./cues";
import { s09GhostCubeAngle } from "./scene-chrome";

const LOCK_MS = 320;
const FLASH_VISIBLE_MS = 1100;
/** Beat index of the first visible S01 content (line + person icons). Index 0 is the empty "Noir" step. */
const FIRST_CONTENT_BEAT = 1;

type PresentationPhase = "splash" | "active";

export function PresentationController() {
  const [phase, setPhase] = useState<PresentationPhase>("splash");
  const [beatIdx, setBeatIdx] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [presenterMode, setPresenterMode] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);

  const locked = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPresentation = useCallback(() => {
    setPhase("active");
    setBeatIdx(FIRST_CONTENT_BEAT);
  }, []);

  const advance = useCallback((delta: 1 | -1) => {
    if (phase !== "active") return;
    if (locked.current) return;
    locked.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      locked.current = false;
    }, LOCK_MS);

    setBeatIdx((i) => Math.max(FIRST_CONTENT_BEAT, Math.min(TOTAL_BEATS - 1, i + delta)));

    if (delta === 1) {
      setShowFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setShowFlash(false), FLASH_VISIBLE_MS);
    }
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && e.metaKey) {
        e.preventDefault();
        setTrainingMode((v) => !v);
        return;
      }

      switch (e.key) {
        case "Enter":
          if (phase === "splash") {
            e.preventDefault();
            startPresentation();
          }
          break;
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
          if (presenterMode) {
            e.preventDefault();
            setPresenterMode(false);
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, phase, presenterMode, startPresentation]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(
    () => () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const beat = BEATS[beatIdx];
  const cue = CUES[beat.id];
  const nextBeat = BEATS[Math.min(beatIdx + 1, TOTAL_BEATS - 1)];
  const nextCue = CUES[nextBeat.id];
  const isLast = beatIdx === TOTAL_BEATS - 1;
  const ghostAngle = s09GhostCubeAngle(beat.scene, beat.step);
  const sceneIndex = SCENE_ORDER.indexOf(beat.scene);
  const progressValue = ((sceneIndex + 1) / TOTAL_SCENES) * 100;
  const nextLabel = isLast ? null : (nextCue?.label ?? nextBeat.scene);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden text-zinc-100"
      style={{ backgroundColor: "#09090B" }}
    >
      <ConferenceStageAmbient />
      <FilmGrain />

      <AnimatePresence>
        {phase === "splash" ? <ConferenceSplash key="splash" /> : null}
      </AnimatePresence>

      {phase === "active" ? (
        <div className="relative z-[2] mx-auto flex h-full w-full max-w-5xl flex-col px-6 pt-8 pb-8">
          <ConferenceSlideChrome
            revealed
            scene={beat.scene}
            sceneIndex={sceneIndex}
            progressValue={progressValue}
          />
          <ConferenceVisualStage
            revealed
            scene={beat.scene}
            step={beat.step}
            ghostAngle={ghostAngle}
          />
        </div>
      ) : null}

      <ConferencePresenterOverlay
        visible={phase === "active"}
        showFlash={showFlash}
        trainingMode={trainingMode}
        presenterMode={presenterMode}
        beatId={beat.id}
        scene={beat.scene}
        cue={cue}
        isLast={isLast}
        nextLabel={nextLabel}
      />
    </div>
  );
}
