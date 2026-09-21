"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

import { HerculeMark } from "@/components/hercule-mark";

const TRANSITION_KEY = "hercule_onboarding_transition_shown";

type OnboardingTransitionProps = {
  onDone: () => void;
};

export function OnboardingTransition({ onDone }: OnboardingTransitionProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(TRANSITION_KEY, "1");
      } catch {
        // localStorage may be unavailable (SSR/private mode) — no-op
      }
      onDone();
    }, 2400);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-5"
      >
        {/* Logo mark — Hercule brand */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <HerculeMark variant="dual" className="size-8 text-white" />
          <span className="text-2xl font-semibold tracking-tight">Hercule</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-sm text-muted-foreground"
        >
          Votre espace est prêt
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.0, duration: 0.8, ease: "easeInOut" }}
          className="h-px w-32 origin-left bg-primary/40"
        />
      </motion.div>
    </div>
  );
}

/** Returns true if the transition should be shown for this session. */
export function shouldShowOnboardingTransition(): boolean {
  try {
    return !localStorage.getItem(TRANSITION_KEY);
  } catch {
    return false;
  }
}
