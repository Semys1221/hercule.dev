"use client";

import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RubiksCube } from "../shared/RubiksCube";
import { ChronologyBoard } from "../shared/ChronologyBoard";
import { OfferPair } from "../shared/OfferPair";
import type { CardSection } from "../scenes/card-deck";
import { S01_Intro } from "../scenes/S01_Intro";
import { S02_WordOfMouth } from "../scenes/S02_WordOfMouth";
import { S03_5_StartingPoint } from "../scenes/S03_5_StartingPoint";
import { S03_6_BuildAudience } from "../scenes/S03_6_BuildAudience";
import { S03_WOMProblem } from "../scenes/S03_WOMProblem";
import { S04_ColdLeads } from "../scenes/S04_ColdLeads";
import { S05_GoogleAds } from "../scenes/S05_GoogleAds";
import { S06_Reframing } from "../scenes/S06_Reframing";
import { S07_ThreeSolutions } from "../scenes/S07_ThreeSolutions";
import { S08_Mechanism } from "../scenes/S08_Mechanism";
import { S09_R2Reveal } from "../scenes/S09_R2Reveal";
import { S11_CaseAccounting } from "../scenes/S11_CaseAccounting";
import { S11_CaseBrokerage } from "../scenes/S11_CaseBrokerage";
import { S12_SocialProof } from "../scenes/S12_SocialProof";
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

const MIN_CARD_SIZE = 8;

const CAROUSEL_SECTION: Partial<Record<SceneId, CardSection>> = {
  S10_JohnDemo: "S10",
};

const OFFER_PAIR_SCENES = new Set<SceneId>(["S13_HerculeDEC", "S14_HerculeCourtage"]);

/** Non-carousel scenes only — S10 uses a stable ChronologyBoard. */
const SCENES: Partial<Record<SceneId, ComponentType<SceneProps>>> = {
  S01_Intro,
  S02_WordOfMouth,
  S03_WOMProblem,
  S03_5_StartingPoint,
  S03_6_BuildAudience,
  S04_ColdLeads,
  S05_GoogleAds,
  S06_Reframing,
  S07_ThreeSolutions,
  S08_Mechanism,
  S09_R2Reveal,
  S11_CaseBrokerage,
  S11_CaseAccounting,
  S12_SocialProof,
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

function stageContentKey(scene: SceneId, carouselSection: CardSection | undefined): string {
  if (OFFER_PAIR_SCENES.has(scene)) return "offer-pair";
  if (carouselSection) return "stage-carousel";
  return scene;
}

function StageBody({
  scene,
  step,
  carouselSection,
}: {
  scene: SceneId;
  step: number;
  carouselSection: CardSection | undefined;
}) {
  if (carouselSection) {
    return <ChronologyBoard section={carouselSection} step={step} />;
  }
  if (OFFER_PAIR_SCENES.has(scene)) {
    return (
      <OfferPair
        edition={scene === "S14_HerculeCourtage" ? "Courtage" : "DEC"}
        step={step}
      />
    );
  }
  const SceneComponent = SCENES[scene];
  if (!SceneComponent) return null;
  return <SceneComponent step={step} />;
}

export const ConferenceVisualStage = memo(function ConferenceVisualStage({
  scene,
  step,
  ghostAngle,
  revealed = true,
}: ConferenceVisualStageProps) {
  const carouselSection = CAROUSEL_SECTION[scene];
  const stageKey = stageContentKey(scene, carouselSection);
  const measureRef = useRef<HTMLDivElement>(null);
  const seenSizeRef = useRef(false);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [animateCardSize, setAnimateCardSize] = useState(false);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const updateSize = () => {
      el.style.maxWidth = "";
      const width = el.offsetWidth;
      const stageHost = el.closest("[data-stage-host]") as HTMLElement | null;
      const maxHeight = stageHost?.clientHeight ?? Infinity;
      const height = Math.min(el.offsetHeight, maxHeight);
      if (width < MIN_CARD_SIZE || height < MIN_CARD_SIZE) return;
      if (seenSizeRef.current) {
        setAnimateCardSize(true);
      } else {
        seenSizeRef.current = true;
      }
      setCardSize((prev) => {
        if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) {
          return prev;
        }
        return { width, height };
      });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene, step]);

  const sized =
    cardSize.width >= MIN_CARD_SIZE && cardSize.height >= MIN_CARD_SIZE;

  return (
    <motion.div
      initial={revealed ? { opacity: 0, y: 24, scale: 0.97 } : false}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
      transition={STAGE_REVEAL}
      data-stage-host
      className="relative mt-8 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      {ghostAngle !== null ? (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <motion.div
            className="opacity-[0.16]"
            animate={{ rotateY: ghostAngle }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <RubiksCube state="solved" size={200} spin={false} />
          </motion.div>
        </div>
      ) : null}

      <motion.div
        initial={false}
        animate={sized ? { width: cardSize.width, height: cardSize.height } : false}
        transition={animateCardSize ? STAGE_SIZE_TRANSITION : { duration: 0 }}
        className="relative z-[1] max-h-full max-w-full overflow-y-auto has-[[data-rubiks-cube]]:[&_[data-stage-card]]:opacity-0 has-[[data-stage-bare]]:[&_[data-stage-card]]:opacity-0"
      >
        {revealed ? (
          <div
            aria-hidden
            data-stage-card
            className="pointer-events-none absolute inset-0 z-[1] rounded-2xl border border-[rgba(26,26,26,0.14)] bg-card/80 shadow-[0_18px_40px_-24px_rgba(26,22,18,0.18)] backdrop-blur-md transition-opacity duration-[400ms]"
          />
        ) : null}

        <div
          ref={measureRef}
          className="relative z-[1] w-max max-w-[min(56rem,calc(100vw-4rem))]"
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={stageKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <StageBody scene={scene} step={step} carouselSection={carouselSection} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
});
