"use client";

import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SilverHerculeMark } from "../shared/SilverHerculeMark";
import { Progress } from "@/components/ui/progress";
import { TOTAL_SCENES } from "./beats";
import { SCENE_TITLES } from "./scene-chrome";
import { SCENE_LABELS, type SceneId } from "./types";

const CHROME_EASE = [0.22, 1, 0.36, 1] as const;

type ConferenceSlideChromeProps = {
  scene: SceneId;
  sceneIndex: number;
  progressValue: number;
  revealed?: boolean;
};

export const ConferenceSlideChrome = memo(function ConferenceSlideChrome({
  scene,
  sceneIndex,
  progressValue,
  revealed = true,
}: ConferenceSlideChromeProps) {
  return (
    <motion.div
      initial={revealed ? { opacity: 0, y: -16 } : false}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: CHROME_EASE }}
      className="flex shrink-0 flex-col gap-6"
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <SilverHerculeMark className="size-8" />
        <AnimatePresence mode="wait">
          <motion.h1
            key={scene}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {SCENE_TITLES[scene]}
          </motion.h1>
        </AnimatePresence>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{SCENE_LABELS[scene]}</span>
          <span>
            Étape {sceneIndex + 1} / {TOTAL_SCENES}
          </span>
        </div>
        <Progress value={progressValue} className="h-1.5 bg-secondary" />
      </div>
    </motion.div>
  );
});
