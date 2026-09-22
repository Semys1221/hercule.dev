"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RubiksCube } from "../shared/RubiksCube";
import { S01_Intro } from "../scenes/S01_Intro";
import { S02_WordOfMouth } from "../scenes/S02_WordOfMouth";
import { S03_WOMProblem } from "../scenes/S03_WOMProblem";
import { S04_ColdLeads } from "../scenes/S04_ColdLeads";
import { S05_GoogleAds } from "../scenes/S05_GoogleAds";
import { S06_Reframing } from "../scenes/S06_Reframing";
import { S07_ThreeSolutions } from "../scenes/S07_ThreeSolutions";
import { S08_Mechanism } from "../scenes/S08_Mechanism";
import { S09_R2Reveal } from "../scenes/S09_R2Reveal";
import { S10_JohnDemo } from "../scenes/S10_JohnDemo";
import { S11_Installation } from "../scenes/S11_Installation";
import { S12_OffersTransition } from "../scenes/S12_OffersTransition";
import { S13_HerculeDEC } from "../scenes/S13_HerculeDEC";
import { S14_HerculeCourtage } from "../scenes/S14_HerculeCourtage";
import { S15_FAQ } from "../scenes/S15_FAQ";
import { S16_Urgency } from "../scenes/S16_Urgency";
import { S17_Close } from "../scenes/S17_Close";
import { S18_StaticOffers } from "../scenes/S18_StaticOffers";
import type { SceneId, SceneProps } from "./types";

const STAGE_SIZE_TRANSITION = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

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

const STAGE_REVEAL = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

type ConferenceVisualStageProps = {
  scene: SceneId;
  step: number;
  ghostAngle: number | null;
  revealed?: boolean;
};

export const ConferenceVisualStage = memo(function ConferenceVisualStage({
  scene,
  step,
  ghostAngle,
  revealed = true,
}: ConferenceVisualStageProps) {
  const SceneComponent = SCENES[scene];
  const cardRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const prevSizeRef = useRef<{ w: number; h: number } | null>(null);
  const lastResizeTsRef = useRef(0);
  const measureCountRef = useRef(0);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [animateCardSize, setAnimateCardSize] = useState(false);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const updateSize = () => {
      const width = el.scrollWidth;
      const height = el.offsetHeight;
      measureCountRef.current += 1;
      if (measureCountRef.current > 1) {
        setAnimateCardSize(true);
      }
      setCardSize({ width, height });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene, step]);

  // #region agent log
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const logLayout = (source: string) => {
      const rect = el.getBoundingClientRect();
      const prev = prevSizeRef.current;
      const deltaW = prev ? Math.round(rect.width - prev.w) : 0;
      const deltaH = prev ? Math.round(rect.height - prev.h) : 0;
      const now = Date.now();
      const frameDeltaMs = lastResizeTsRef.current
        ? now - lastResizeTsRef.current
        : 0;
      lastResizeTsRef.current = now;
      const cubeInCard = el.querySelector("[data-rubiks-cube]") !== null;
      const cardChrome = el.querySelector("[data-stage-card]");
      const cardOpacity = cardChrome
        ? getComputedStyle(cardChrome).opacity
        : null;

      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "87a15d",
        },
        body: JSON.stringify({
          sessionId: "87a15d",
          runId: "post-fix",
          hypothesisId: source.startsWith("scene") ? "B" : "A",
          location: "ConferenceVisualStage.tsx:layout",
          message: "card layout snapshot",
          data: {
            source,
            scene,
            step,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            targetW: cardSize.width,
            targetH: cardSize.height,
            deltaW,
            deltaH,
            frameDeltaMs,
            cubeInCard,
            cardOpacity,
            sizeAnimation: animateCardSize,
          },
          timestamp: now,
        }),
      }).catch(() => {});

      prevSizeRef.current = { w: rect.width, h: rect.height };
    };

    logLayout("mount");
    const ro = new ResizeObserver(() => logLayout("resize"));
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene, step, cardSize.width, cardSize.height, animateCardSize]);
  // #endregion

  return (
    <motion.div
      initial={revealed ? { opacity: 0, y: 24, scale: 0.97 } : false}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
      transition={STAGE_REVEAL}
      className="relative mt-8 flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto"
    >
      {ghostAngle !== null ? (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <motion.div
            className="opacity-[0.07]"
            animate={{ rotateY: ghostAngle }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <RubiksCube state="solved" size={200} spin={false} />
          </motion.div>
        </div>
      ) : null}

      <motion.div
        ref={cardRef}
        initial={false}
        animate={{ width: cardSize.width, height: cardSize.height }}
        transition={animateCardSize ? STAGE_SIZE_TRANSITION : { duration: 0 }}
        className="relative z-[1] max-w-full overflow-visible has-[[data-rubiks-cube]]:[&_[data-stage-card]]:opacity-0"
      >
        {revealed ? (
          <div
            aria-hidden
            data-stage-card
            className="pointer-events-none absolute inset-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md transition-opacity duration-[400ms] supports-[backdrop-filter]:bg-zinc-900/40"
          />
        ) : null}

        <div
          ref={measureRef}
          className="absolute top-0 left-0 w-max max-w-[min(56rem,calc(100vw-4rem))]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={scene}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38 }}
            >
              <SceneComponent step={step} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
