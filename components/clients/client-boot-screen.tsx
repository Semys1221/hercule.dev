"use client";

import { motion } from "framer-motion";

import { HerculeMark } from "@/components/hercule-mark";
import { Progress } from "@/components/ui/progress";
type ClientBootScreenProps = {
  progress: number;
  showWelcome?: boolean;
  exiting?: boolean;
  onExitComplete?: () => void;
};

export function ClientBootScreen({
  progress,
  showWelcome = false,
  exiting = false,
  onExitComplete,
}: ClientBootScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (exiting) {
          onExitComplete?.();
        }
      }}
      aria-busy={!exiting}
      aria-label="Chargement de l'espace client"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full max-w-xs flex-col items-center gap-6 px-6"
      >
        <div className="flex items-center gap-3">
          <HerculeMark variant="dual" className="size-8 text-foreground" />
          <span className="text-2xl font-semibold tracking-tight">Hercule</span>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Progress
            value={progress}
            className="h-0.5 bg-tracking-muted [&_[data-slot=progress-indicator]]:bg-tracking"
          />
          <p className="text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>

        {showWelcome && progress >= 100 ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center text-sm text-muted-foreground"
          >
            Bienvenue — votre espace est prêt
          </motion.p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
